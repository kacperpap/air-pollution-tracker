import asyncio
import atexit
import multiprocessing
import sys
import time
import traceback
import aio_pika # type: ignore
import json
import os
from concurrent.futures import ThreadPoolExecutor
from typing import Optional, Dict
import threading

from utils import serialize_output, log_with_time, set_thread_context
from models.euler_modified_multibox_model.simulation import simulate_pollution_spread
from models.euler_modified_multibox_model.simulation_types.input_type import *
from models.euler_modified_multibox_model.simulation_types.output_type import *


class SimulationWorker:
    def __init__(self):
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._thread: Optional[threading.Thread] = None
        self._shutdown_event = threading.Event()
        
    def start(self):
        """Start the worker in a new thread with its own event loop."""
        def run_loop():
            self._loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self._loop)
            try:
                self._loop.run_forever()
            finally:
                self._loop.close()
                
        self._thread = threading.Thread(target=run_loop, daemon=True)
        self._thread.start()
        
    def stop(self):
        if self._loop:
            self._loop.call_soon_threadsafe(self._loop.stop)
        if self._thread:
            self._thread.join(timeout=5)
        self._shutdown_event.set()

class SimulationPool:
    def __init__(self, max_workers: int = None):
        self.max_workers = max_workers or multiprocessing.cpu_count()
        self.executor = ThreadPoolExecutor(max_workers=self.max_workers)
        self.workers: Dict[int, SimulationWorker] = {}
        self._lock = threading.Lock()
        
    def get_worker(self) -> SimulationWorker:
        """Get or create a worker for the current thread."""
        thread_id = threading.get_ident()
        with self._lock:
            if thread_id not in self.workers:
                worker = SimulationWorker()
                worker.start()
                self.workers[thread_id] = worker
            return self.workers[thread_id]
            
    def cleanup(self):
        with self._lock:
            for worker in self.workers.values():
                worker.stop()
            self.workers.clear()
        self.executor.shutdown(wait=True)

class RabbitMQHandler:
    def __init__(self, url: str, queue_name: str):
        self.url = url
        self.queue_name = queue_name
        self.simulation_pool = SimulationPool()
        self._connection: Optional[aio_pika.Connection] = None
        self._channel: Optional[aio_pika.Channel] = None
        self._connection_retry_delay = 5
        self._shutdown_event = asyncio.Event()
        
    async def cleanup(self):
        log_with_time("Cleaning up RabbitMQ handler...")
        
        if self._channel:
            try:
                await self._channel.close()
            except Exception:
                pass
                
        if self._connection:
            try:
                await self._connection.close()
            except Exception:
                pass
            
        self.simulation_pool.cleanup()
        log_with_time("RabbitMQ handler cleanup complete")
        
    async def ensure_connection(self) -> bool:
        while not self._shutdown_event.is_set():
            try:
                if not self._connection or self._connection.is_closed:
                    self._connection = await aio_pika.connect_robust(self.url)
                    self._channel = await self._connection.channel()
                    await self._channel.set_qos(prefetch_count=self.simulation_pool.max_workers)
                    log_with_time('Successfully connected to RabbitMQ')
                return True
            except Exception:
                log_with_time('Failed to connect to RabbitMQ, retrying in 5 seconds...', 'error')
                await asyncio.sleep(self._connection_retry_delay)
        return False

    def run_simulation(self, data: dict) -> tuple:
        """Run simulation in the current thread's worker."""
        try:
            thread_id = threading.get_ident()
            set_thread_context(thread_id)
            
            converted_data: InputType = convert_to_input_type(data)
            
            num_steps = data['numSteps']
            pollutants = data.get('pollutants', [])
            grid_density = data['gridDensity']
            urbanized = data['urbanized']
            margin_boxes = data['marginBoxes']
            initial_distance = data['initialDistance']
            decay_rate = data['decayRate']
            emission_rate = data['emissionRate']
            snap_interval = data['snapInterval']
            
            log_with_time(f"Starting simulation with parameters: num_steps={num_steps}")
            
            start_time = time.time()
            
            result = simulate_pollution_spread(
                converted_data,
                num_steps,
                pollutants,
                grid_density=grid_density,
                urbanized=urbanized,
                margin_boxes=margin_boxes,
                initial_distance=initial_distance,
                decay_rate=decay_rate,
                emission_rate=emission_rate,
                snap_interval=snap_interval
            )
            
            concentrations, snap_concentrations, boxes, temp_values, press_values, u_values, v_values = result
            
            end_time = time.time()
            log_with_time(f"Simulation completed in {end_time - start_time:.3f} seconds")
            
            final_data: OutputType = convert_to_output_type(
                concentrations,
                snap_concentrations,
                boxes,
                temp_values,
                press_values,
                u_values,
                v_values
            )
            
            return final_data, "completed"
            
        except Exception as e:
            log_with_time(f"Simulation failed: {str(e)}", 'error')
            traceback.print_exc()
            return None, "failed"

    async def process_message(self, message: aio_pika.IncomingMessage):
        correlation_id = message.correlation_id
        status = "failed"
        result = None
        
        try:
            log_with_time(f'Processing message (Correlation ID: {correlation_id})')
            data = json.loads(message.body)
            
            loop = asyncio.get_running_loop()
            result, status = await loop.run_in_executor(
                self.simulation_pool.executor,
                self.run_simulation,
                data
            )
            
        except Exception as e:
            log_with_time(f'Error processing message: {str(e)}', 'error')
            traceback.print_exc()
            
        finally:
            try:
                if message.reply_to:
                    response_data = {"status": status, "result": result}
                    await self._channel.default_exchange.publish(
                        aio_pika.Message(
                            body=serialize_output(response_data).encode(),
                            correlation_id=correlation_id
                        ),
                        routing_key=message.reply_to
                    )
            finally:
                await message.ack()

    async def start(self):
        while not self._shutdown_event.is_set():
            try:
                if not await self.ensure_connection():
                    continue

                queue = await self._channel.declare_queue(
                    self.queue_name,
                    durable=False
                )
                
                log_with_time(f'Waiting for messages in "{self.queue_name}"')
                
                async with queue.iterator() as queue_iter:
                    async for message in queue_iter:
                        if self._shutdown_event.is_set():
                            break
                        asyncio.create_task(self.process_message(message))
                        
            except aio_pika.exceptions.ConnectionClosed:
                log_with_time('RabbitMQ connection lost, attempting to reconnect...', 'error')
                continue
            except Exception as e:
                log_with_time(f'Unexpected error in message processing loop: {str(e)}', 'error')
                await asyncio.sleep(self._connection_retry_delay)
                continue

class Application:
    def __init__(self):
        self.rabbit_handler: Optional[RabbitMQHandler] = None
        self._shutdown_event = asyncio.Event()
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        
    async def startup(self):
        log_with_time("Starting application...")
        
        self._loop = asyncio.get_running_loop()
            
        self.rabbit_handler = RabbitMQHandler(
            url=os.getenv("RABBITMQ_URL", "amqp://localhost"),
            queue_name=os.getenv("RABBITMQ_REQUEST_QUEUE", "simulation_request_queue")
        )
        
        log_with_time("Application started successfully")

    async def shutdown(self, sig=None):
        
        log_with_time("Shutting down application...")
        self._shutdown_event.set()
        
        if self.rabbit_handler:
            await self.rabbit_handler.cleanup()
            
        tasks = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()]
        for task in tasks:
            task.cancel()
            
        await asyncio.gather(*tasks, return_exceptions=True)
                    
        log_with_time("Application shutdown complete")

    async def run(self):
        await self.startup()
        try:
            if self.rabbit_handler:
                await self.rabbit_handler.start()
        except Exception as e:
            log_with_time(f"Error in main loop: {e}", 'critical')
            traceback.print_exc()
        finally:
            await self.shutdown()

def main():
    
    app = Application()
    atexit.register(lambda: asyncio.run(app.shutdown()))
    
    try:
        if sys.platform == 'win32':
            log_with_time('Detected win32 platform, using asyncio.ProactorEventLoop()')
            loop = asyncio.ProactorEventLoop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(app.run())
        else:
            log_with_time('Detected Unix platform, using default asyncio loop')
            asyncio.run(app.run())
    except Exception as e:
        log_with_time(f"Fatal error: {e}", 'critical')
        traceback.print_exc()
    finally:
        log_with_time("Application terminated")

if __name__ == "__main__":
    main()