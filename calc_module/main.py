import asyncio
import atexit
import multiprocessing as mp
from multiprocessing import Process, Queue, Event
from queue import Empty
import signal
import sys
import time
import traceback
import aio_pika  # type: ignore
import json
import os
from typing import Optional
from dataclasses import dataclass

from utils import serialize_output, log_with_time, set_context_id
from models.euler_modified_multibox_model.simulation import simulate_pollution_spread
from models.euler_modified_multibox_model.simulation_types.input_type import *
from models.euler_modified_multibox_model.simulation_types.output_type import *

@dataclass
class SimulationTask:
    data: dict
    correlation_id: str
    reply_to: str

# Sentinel, aby worker mógł się wyłączyć bez blokady
SENTINEL = None

class SimulationWorker(Process):
    def __init__(self, task_queue: Queue, result_queue: Queue, shutdown_event: Event):
        super().__init__()
        self.task_queue = task_queue
        self.result_queue = result_queue
        self.shutdown_event = shutdown_event
        
    def run_simulation(self, data: dict) -> tuple:
        try:
            process_id = os.getpid()
            set_context_id(process_id)
            
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

    def run(self):
        try:
            while not self.shutdown_event.is_set():
                try:
                    task = self.task_queue.get(timeout=1)
                except KeyboardInterrupt:
                    break
                except Empty:
                    continue
                except Exception as e:
                    log_with_time(f"Worker process error: {e}", 'error')
                    continue

                # Jeśli otrzymamy sentinel, wychodzimy z pętli
                if task is SENTINEL:
                    break

                result, status = self.run_simulation(task.data)
                self.result_queue.put({
                    'correlation_id': task.correlation_id,
                    'reply_to': task.reply_to,
                    'status': status,
                    'result': result
                })
        except KeyboardInterrupt:
            pass  # W razie przerwania, po prostu zakończ worker
        finally:
            # Opcjonalnie możemy dodać log o zamykaniu procesu
            log_with_time(f"Worker {os.getpid()} shutting down.")


class SimulationPool:
    def __init__(self, max_workers: int = None):
        self.max_workers = max_workers or mp.cpu_count()
        self.task_queue = Queue()
        self.result_queue = Queue()
        self.shutdown_event = Event()
        self.workers: list[SimulationWorker] = []
        
    def start(self):
        for _ in range(self.max_workers):
            worker = SimulationWorker(self.task_queue, self.result_queue, self.shutdown_event)
            worker.start()
            self.workers.append(worker)
            
    def cleanup(self):
        # Sygnalizujemy zakończenie pracownikom
        self.shutdown_event.set()
        # Wysyłamy do kolejki SENTINEL – jeden dla każdego worker’a,
        # dzięki czemu nie zostaną zablokowani przy oczekiwaniu na zadanie.
        for _ in range(len(self.workers)):
            self.task_queue.put(SENTINEL)
        
        for worker in self.workers:
            worker.join(timeout=2)
            
        for worker in self.workers:
            if worker.is_alive():
                worker.terminate()
                worker.join(timeout=1)
        
        while not self.task_queue.empty():
            try:
                self.task_queue.get_nowait()
            except Empty:  
                break
                
        while not self.result_queue.empty():
            try:
                self.result_queue.get_nowait()
            except Empty:
                break


class RabbitMQHandler:
    def __init__(self, url: str, queue_name: str):
        self.url = url
        self.queue_name = queue_name
        self.simulation_pool = SimulationPool()
        self._connection: Optional[aio_pika.Connection] = None
        self._channel: Optional[aio_pika.Channel] = None
        self._connection_retry_delay = 5
        self._shutdown_event = asyncio.Event()
        self._active_tasks: set = set()
        self.SIMULATION_TIMEOUT = 600
        self._cleanup_lock = asyncio.Lock()
        
    async def cleanup(self):
        async with self._cleanup_lock:
            log_with_time("Cleaning up RabbitMQ handler...")
            self._shutdown_event.set()

            if self._channel:
                try:
                    if not self._channel.is_closed:
                        await self._channel.close()
                except Exception as e:
                    log_with_time(f"Error closing channel: {e}", 'error')

            if self._connection:
                try:
                    if not self._connection.is_closed:
                        await self._connection.close()
                except Exception as e:
                    log_with_time(f"Error closing connection: {e}", 'error')

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

    async def process_message(self, message: aio_pika.IncomingMessage):
        try:
            log_with_time(f'Processing message (Correlation ID: {message.correlation_id})')
            data = json.loads(message.body)
            
            self.simulation_pool.task_queue.put(SimulationTask(
                data=data,
                correlation_id=message.correlation_id,
                reply_to=message.reply_to
            ))
            
        except Exception as e:
            log_with_time(f'Error processing message: {str(e)}', 'error')
            traceback.print_exc()
            
        finally:
            try:
                await message.ack()
            except Exception:
                pass

    async def check_results(self):
        while not self._shutdown_event.is_set():
            try:
                result = self.simulation_pool.result_queue.get_nowait()
                if result['reply_to']:
                    response_data = {
                        "status": result['status'],
                        "result": result['result']
                    }
                    await self._channel.default_exchange.publish(
                        aio_pika.Message(
                            body=serialize_output(response_data).encode(),
                            correlation_id=result['correlation_id']
                        ),
                        routing_key=result['reply_to']
                    )
            except Empty: 
                await asyncio.sleep(0.1)
            except Exception as e:
                log_with_time(f"Error processing result: {e}", 'error')
                await asyncio.sleep(1)

    async def start(self):
        self.simulation_pool.start()
        
        result_checker = asyncio.create_task(self.check_results())
        self._active_tasks.add(result_checker)
        result_checker.add_done_callback(self._active_tasks.discard)
        
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
                    message = None
                    try:
                        async for message in queue_iter:
                            if self._shutdown_event.is_set():
                                break
                            
                            task = asyncio.create_task(self.process_message(message))
                            self._active_tasks.add(task)
                            task.add_done_callback(self._active_tasks.discard)
                    except Exception as e:
                        if not self._shutdown_event.is_set():
                            log_with_time(f'Error in message iterator: {e}', 'error')
                            if message:
                                try:
                                    await message.ack()
                                except Exception:
                                    pass
                        break

            except aio_pika.exceptions.ConnectionClosed:
                if not self._shutdown_event.is_set():
                    log_with_time('RabbitMQ connection lost, attempting to reconnect...', 'error')
                    await asyncio.sleep(self._connection_retry_delay)
            except Exception as e:
                if not self._shutdown_event.is_set():
                    log_with_time(f'Unexpected error in message processing loop: {e}', 'error')
                    await asyncio.sleep(self._connection_retry_delay)

class Application:
    def __init__(self):
        self.rabbit_handler: Optional[RabbitMQHandler] = None
        self._shutdown_event = asyncio.Event()
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._shutdown_lock = asyncio.Lock()
        
    def _handle_signal(self, signame):
        log_with_time(f"Received signal {signame}")
        if not self._shutdown_event.is_set():
            if self._loop and self._loop.is_running():
                self._loop.create_task(self.shutdown(sig=signame))
        
    async def startup(self):
        log_with_time("Starting application...")
        
        self._loop = asyncio.get_running_loop()
            
        if sys.platform != 'win32':
            for sig in (signal.SIGTERM, signal.SIGINT):
                self._loop.add_signal_handler(
                    sig,
                    lambda s=sig: self._handle_signal(s)
                )
        else:
            def win_signal_handler():
                if not self._shutdown_event.is_set():
                    asyncio.create_task(self.shutdown(sig='SIGINT'))
            self._loop.set_exception_handler(
                lambda loop, context: win_signal_handler() if isinstance(context.get('exception'), KeyboardInterrupt) else None
            )
            
        self.rabbit_handler = RabbitMQHandler(
            url=os.getenv("RABBITMQ_URL", "amqp://localhost"),
            queue_name=os.getenv("RABBITMQ_REQUEST_QUEUE", "simulation_request_queue")
        )
        
        log_with_time("Application started successfully")

    async def shutdown(self, sig=None):
        if self._shutdown_lock.locked() or self._shutdown_event.is_set():
            return

        async with self._shutdown_lock:
            log_with_time(f"Shutting down application... (Signal: {sig})")
            self._shutdown_event.set()

            if self.rabbit_handler:
                await self.rabbit_handler.cleanup()

            tasks = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()]
            
            try:
                done, pending = await asyncio.wait(tasks, timeout=2)
                for task in pending:
                    if not task.done():
                        task.cancel()
                
                if pending:
                    await asyncio.wait(pending, timeout=1)
            except asyncio.TimeoutError:
                log_with_time("Some tasks did not complete in time")
            except Exception as e:
                log_with_time(f"Error during shutdown: {e}", 'error')

            log_with_time("Application shutdown complete")
            
            if self._loop and self._loop.is_running():
                self._loop.stop()

    async def run(self):
        await self.startup()
        try:
            if self.rabbit_handler:
                await self.rabbit_handler.start()
        except asyncio.CancelledError:
            pass
        except Exception as e:
            log_with_time(f"Error in main loop: {e}", 'critical')
            traceback.print_exc()
        finally:
            await self.shutdown()

def main():
    if sys.platform == 'win32':
        mp.freeze_support()
    
    app = Application()
    
    try:
        if sys.platform == 'win32':
            log_with_time('Detected win32 platform, using asyncio.ProactorEventLoop()')
            loop = asyncio.ProactorEventLoop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(app.run())
        else:
            log_with_time('Detected Unix platform, using default asyncio loop')
            asyncio.run(app.run())
    except KeyboardInterrupt:
        log_with_time("Received keyboard interrupt")
    except Exception as e:
        log_with_time(f"Fatal error: {e}", 'critical')
        traceback.print_exc()
    finally:
        log_with_time("Application terminated")

if __name__ == "__main__":
    main()
