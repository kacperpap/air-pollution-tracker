import asyncio
from datetime import datetime
import time
import os
import traceback
import aio_pika # type: ignore
import json
import uuid
from models.euler_modified_multibox_model.debug_utils.logging import log_to_file
from dotenv import load_dotenv # type: ignore


from utils import log_with_time, serialize_output
from models.euler_modified_multibox_model.simulation import simulate_pollution_spread
from models.euler_modified_multibox_model.simulation_types.input_type import *
from models.euler_modified_multibox_model.simulation_types.output_type import *


load_dotenv()

    

def simulate(data, debug=True):
    """
    Wraps simulataion of pollution spread using given data and parameters.
    
    Args:
        data (dict): Input data for the simulation.
        num_steps (int, optional): Number of simulation steps. Defaults to 1000.
        dt (int, optional): Time step for the simulation. Defaults to 1.
        pollutatns (list, optional): List of pollutants to simulate. Defaults to ['CO'].
        grid_denstiy (str, optional): Grid density for the simulation. Defaults to "medium".
        urbanized (bool, optional): Whether to simulate urbanized area. Defaults to False.
        margin_boxes (int, optional): Number of margin boxes. Defaults to 1.
        initial_distance (int, optional): Initial distance between simulation boxes. Defaults to 1.
    """
    
    timestamp = datetime.now().strftime("%Y_%m_%d_%H%M%S")
        
    debug_dir = f"models/euler_modified_multibox_model/debug/{timestamp}/"
    if not os.path.exists(debug_dir):
        os.makedirs(debug_dir)
        
    debug_filepath = os.path.join(debug_dir, "debug.txt")
    debug_file = open(debug_filepath, "w") if debug else None
    
    if debug:
        log_with_time(f"simulate -> runnig in debug mode, created debug directory in: {debug_dir}")
    
    try:
        converted_data: InputType = convert_to_input_type(data)
                
        num_steps = data['numSteps']
        dt = data['dt']
        pollutants = data.get('pollutants', [])
        grid_density = data['gridDensity']
        urbanized = data['urbanized']
        margin_boxes = data['marginBoxes']
        initial_distance = data['initialDistance']
        
        if debug:
            log_to_file(debug_file, "simulate", f"num_steps={num_steps}\ndt={dt}\npollutants={pollutants}\ngrid_density={grid_density}\nurbanized={urbanized}\nmargin_boxes={margin_boxes}\ninitial_distance={initial_distance}", "Simulation parameters")
                
        log_with_time(f"simulate -> starting function simulate_pollution_spread with parameters: "
                      f"num_steps={num_steps}, dt={dt}, pollutants={pollutants}, "
                      f"grid_density={grid_density}, "
                      f"urbanized={urbanized}, margin_boxes={margin_boxes}, initial_distance={initial_distance}")
        
        start_time = time.time()

        concentrations, boxes, temp_values, press_values, u_values, v_values = simulate_pollution_spread(
            converted_data, num_steps, dt, 
            pollutants=pollutants, 
            grid_density=grid_density, 
            urbanized=urbanized, 
            margin_boxes=margin_boxes, 
            initial_distance=initial_distance, 
            debug=debug, 
            debug_with_plots=debug, 
            debug_dir=debug_dir,
            debug_file=debug_file
        )
        
        
        end_time = time.time()
        elapsed_time = end_time - start_time

        log_with_time(f"simulate -> simulate_pollution_spread completed in {elapsed_time:.3f} seconds.")
        
        final_data: OutputType = convert_to_output_type(
            concentrations,
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



async def process_message(message: aio_pika.IncomingMessage, channel: aio_pika.Channel, timeout: int = 60):
    async with message.process():
        correlation_id = message.correlation_id
        unique_id = str(uuid.uuid4())
        
        log_with_time(f'Processing message with ID: {unique_id} (Correlation ID: {correlation_id})')

        try:
            data = json.loads(message.body)
            
            log_with_time('Starting simulation...')
            
            """ 
            Run simulation only in one thread, due to prefetch count set as 1
            only one simulation is being processed at a time, so there is no need to
            for creating pool of separte processes
            """
            try:
                result, status = await asyncio.wait_for(
                    asyncio.to_thread(simulate, data), 
                    timeout=timeout
                )
            except asyncio.TimeoutError:
                log_with_time(f'Simulation timed out after {timeout} seconds')
                status = "timeExceeded"
                result = None

            log_with_time(f'Simulation status: {status}')

            if message.reply_to:
                log_with_time(f'Publishing result to reply queue: {message.reply_to} for message ID: {unique_id}')
                
                response_data = {
                    "status": status,
                    "result": result
                }
                        
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

        except Exception as e:
            log_with_time(f'Error processing message {unique_id}: {str(e)}')
            log_with_time(f'Traceback: {traceback.format_exc()}')
            
            if message.reply_to:
                await channel.default_exchange.publish(
                    aio_pika.Message(
                        body=json.dumps({"status": "failed", "result": None}).encode(),
                        correlation_id=correlation_id
                    ),
                    routing_key=message.reply_to
                )

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
                rabbitmq will itself end message processing after 120 sec.
                """
                # queue_args = {
                #     "x-message-ttl": 5000,  
                # }
                
                # queue = await channel.declare_queue(request_queue, durable=False, arguments=queue_args)
                queue = await channel.declare_queue(request_queue, durable=False)

                log_with_time(f'calc_model -> rabbitmq_listener: Queue "{request_queue}" declared successfully.')

                await channel.set_qos(prefetch_count=1)

                log_with_time(f'calc_model -> rabbitmq_listener: Waiting for messages in "{request_queue}".')
                
                async with queue.iterator() as queue_iter:
                    async for message in queue_iter:
                        await process_message(message, channel)

        except Exception as e:
            log_with_time(f'calc_model -> rabbitmq_listener: Error connecting to RabbitMQ: {e}')
            await asyncio.sleep(5) 

if __name__ == "__main__":
    log_with_time("Starting the listener...")
    asyncio.run(rabbitmq_listener())
    