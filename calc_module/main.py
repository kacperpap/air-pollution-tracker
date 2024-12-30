import asyncio
from datetime import datetime
import time
import os
import traceback
import aio_pika # type: ignore
import json
import uuid
from dotenv import load_dotenv # type: ignore

import multiprocessing
from concurrent.futures import ProcessPoolExecutor
from functools import partial


from utils import log_with_time, serialize_output
from models.euler_modified_multibox_model.simulation import simulate_pollution_spread
from models.euler_modified_multibox_model.simulation_types.input_type import *
from models.euler_modified_multibox_model.simulation_types.output_type import *


load_dotenv()

process_pool = ProcessPoolExecutor(max_workers=multiprocessing.cpu_count())
log_with_time(f'global -> defined process pool with {multiprocessing.cpu_count()} workers')

def simulate(data, debug=False):
    debug_dir = None
    if debug:
        timestamp = datetime.now().strftime("%Y_%m_%d_%H%M%S")
        
        debug_dir = f"models/euler_modified_multibox_model/debug/{timestamp}/"
        if not os.path.exists(debug_dir):
            os.makedirs(debug_dir)
            
    if debug:
        log_with_time(f"simulate -> runnig in debug mode, created debug directory in: {debug_dir}")
    
    try:
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
                    
        log_with_time(f"simulate -> starting function simulate_pollution_spread with parameters: "
                      f"num_steps={num_steps}, pollutants={pollutants}, "
                      f"grid_density={grid_density}, "
                      f"urbanized={urbanized}, margin_boxes={margin_boxes}, initial_distance={initial_distance}, "
                      f"decay_rate={decay_rate}, emission_rate={emission_rate}, snap_interval={snap_interval}")
        
        start_time = time.time()

        concentrations, snap_concentrations, boxes, temp_values, press_values, u_values, v_values = simulate_pollution_spread(
            converted_data, 
            num_steps, 
            pollutants, 
            grid_density=grid_density, 
            urbanized=urbanized, 
            margin_boxes=margin_boxes, 
            initial_distance=initial_distance, 
            decay_rate=decay_rate,
            emission_rate=emission_rate,
            debug=False,
            debug_dir=debug_dir,
            snap_interval=snap_interval
        )
               
                
        end_time = time.time()
        elapsed_time = end_time - start_time

        log_with_time(f"simulate -> simulate_pollution_spread completed in {elapsed_time:.3f} seconds.")
        
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
        log_with_time(f"simulate -> Error occurred during simulation: {str(e)}")
        traceback.print_exc()
        return None, "failed"  


async def process_messages(messages, channel):
    tasks = []
    for message in messages:
        task = asyncio.create_task(process_single_message(message, channel))
        tasks.append(task)
    await asyncio.gather(*tasks)

async def process_single_message(message: aio_pika.IncomingMessage, channel: aio_pika.Channel, timeout: int = 60):
    correlation_id = message.correlation_id
    unique_id = str(uuid.uuid4())
    
    log_with_time(f'Processing message with ID: {unique_id} (Correlation ID: {correlation_id})')
    
    try:
        data = json.loads(message.body)
        simulation_func = partial(simulate, debug=False)
        
        try:
            result, status = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(
                    process_pool, 
                    simulation_func,
                    data
                ),
                timeout=timeout
            )
        except asyncio.TimeoutError:
            log_with_time(f'Simulation timed out after {timeout} seconds')
            status = "timeExceeded"
            result = None

        if message.reply_to:
            log_with_time(f'Publishing result to reply queue: {message.reply_to} for message ID: {unique_id}')
            
            response_data = {"status": status, "result": result}
            serialized_result = serialize_output(response_data)
            
            await channel.default_exchange.publish(
                aio_pika.Message(
                    body=serialized_result.encode(),
                    correlation_id=correlation_id
                ),
                routing_key=message.reply_to
            )
            log_with_time(f'Result published for message ID: {unique_id} to queue {message.reply_to}')
        else:
            log_with_time(f'Error: No reply_to field in message {unique_id}. Cannot send the result.')
    finally:
        await message.ack()

async def rabbitmq_listener():
    request_queue = os.getenv('RABBITMQ_REQUEST_QUEUE')
    rabbitmq_url = os.getenv('RABBITMQ_URL', 'amqp://localhost')
    
    while True:
        try:
            connection = await aio_pika.connect_robust(f"{rabbitmq_url}")
            log_with_time(f'calc_model -> rabbitmq_listener: Successfully connected to RabbitMQ.')

            async with connection:
                channel = await connection.channel()
                
                """ 
                TTL - time to live for request send by rabbitmq,
                if there is a problem that blocks executing simulation,
                or simulation timeout mechanism does not work,
                rabbitmq will itself end message processing after x sec.
                """
                # queue_args = {
                #     "x-message-ttl": 5000,  
                # }
                
                # queue = await channel.declare_queue(request_queue, durable=False, arguments=queue_args)
                queue = await channel.declare_queue(request_queue, durable=False)

                log_with_time(f'calc_model -> rabbitmq_listener: Queue "{request_queue}" declared successfully.')

                prefetch_count = multiprocessing.cpu_count()
                await channel.set_qos(prefetch_count=prefetch_count)

                log_with_time(f'calc_model -> rabbitmq_listener: Waiting for messages in "{request_queue}".')
                
                
                async with queue.iterator() as queue_iter:
                    async for message in queue_iter:
                        asyncio.create_task(process_single_message(message, channel))

        except Exception as e:
            log_with_time(f'calc_model -> rabbitmq_listener: Error connecting to RabbitMQ: {e}')
            await asyncio.sleep(5) 
        finally:
            process_pool.shutdown(wait=True)

if __name__ == "__main__":
    log_with_time("Starting the listener...")
    asyncio.run(rabbitmq_listener())
    