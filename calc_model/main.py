import asyncio
from dataclasses import dataclass
from datetime import datetime
import time
import os
import traceback
from typing import Any, Dict, List
import aio_pika
import json
import uuid
import numpy as np
from dotenv import load_dotenv # type: ignore

from models.euler_modified_multibox_model.concentration_simulation import simulate_pollution_spread
from models.euler_modified_multibox_model.input_type import *
from models.euler_modified_multibox_model.output_type import *


load_dotenv()
    
def log_with_time(message):
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
    print(f'[{now}] {message}')
    
# def numpy_to_python_types(obj: Any) -> Any:
#     """
#     Recursively converts NumPy objects (e.g., arrays, int64, float64) to Python native types.
    
#     Args:
#         obj: Any object to be converted.
        
#     Returns:
#         Python native types (e.g., list, int, float, dict) with all NumPy types converted.
#     """
#     if isinstance(obj, np.ndarray):
#         return obj.tolist()  # Convert arrays to lists
    
#     if isinstance(obj, (np.int_, np.intc, np.intp, np.int8, np.int16, np.int32, np.int64,
#                         np.uint8, np.uint16, np.uint32, np.uint64)):
#         return int(obj)  # Convert NumPy integers to Python int
    
#     if isinstance(obj, (np.float16, np.float32, np.float64)):
#         return float(obj)  # Convert NumPy floats to Python float
    
#     if isinstance(obj, np.bool_):
#         return bool(obj)  # Convert NumPy booleans to Python bool
    
#     if isinstance(obj, dict):
#         return {k: numpy_to_python_types(v) for k, v in obj.items()}  # Recursively convert dicts
    
#     if isinstance(obj, (list, tuple)):
#         return [numpy_to_python_types(item) for item in obj]  # Recursively convert lists and tuples
    
#     return obj  # If it's not a NumPy object, return as is

class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NpEncoder, self).default(obj)

def serialize_output(output_data: OutputType) -> str:
    """
    Serializes the output data to JSON format after converting NumPy types.
    
    Args:
        output_data: The output data in OutputType format.
        
    Returns:
        str: Serialized JSON data as a string.
    """
    try:
        serialized_result = json.dumps(output_data, cls=NpEncoder)
        
        log_with_time(f"Serialized data types: {str(type(output_data))}")
        
        return serialized_result
    except Exception as e:
        log_with_time(f"Error during serialization: {str(e)}")
        raise


def simulate(data, num_steps=1000, dt=1, pollutatns=['CO', 'O3'], box_size=(None,None), grid_denstiy="medium", urbanized=False, margin_boxes=1, initial_distance=1):
    """
    Simulates pollution spread using given data and parameters.
    
    Args:
        data (dict): Input data for the simulation.
        num_steps (int, optional): Number of simulation steps. Defaults to 1000.
        dt (int, optional): Time step for the simulation. Defaults to 1.
        pollutatns (list, optional): List of pollutants to simulate. Defaults to ['CO'].
        box_size (tuple, optional): Size of the simulation box. Defaults to (None, None).
        grid_denstiy (str, optional): Grid density for the simulation. Defaults to "medium".
        urbanized (bool, optional): Whether to simulate urbanized area. Defaults to False.
        margin_boxes (int, optional): Number of margin boxes. Defaults to 1.
        initial_distance (int, optional): Initial distance between simulation boxes. Defaults to 1.

    Returns:
        dict: Final concentration of pollutants after simulation.
    """
    
    try:
        converted_data: InputType = convert_to_input_type(data)
                
        log_with_time(f"simulate -> starting function simulate_pollution_spread with parameters: "
                      f"num_steps={num_steps}, dt={dt}, pollutants={pollutatns}, "
                      f"box_size={box_size}, grid_density={grid_denstiy}, "
                      f"urbanized={urbanized}, margin_boxes={margin_boxes}, initial_distance={initial_distance}")
        
        start_time = time.time()

        concentrations, boxes, temp_values, press_values, u_values, v_values = simulate_pollution_spread(
            converted_data, num_steps, dt, 
            pollutants=pollutatns, 
            box_size=box_size, 
            grid_density=grid_denstiy, 
            urbanized=urbanized, 
            margin_boxes=margin_boxes, 
            initial_distance=initial_distance, 
            debug=False
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
        
        return final_data

    except Exception as e:
        log_with_time(f"simulate -> Error occurred during simulation: {str(e)}")
        raise  



async def process_message(message: aio_pika.IncomingMessage, channel: aio_pika.Channel):
    async with message.process():
        correlation_id = message.correlation_id
        unique_id = str(uuid.uuid4())
        
        log_with_time(f'Processing message with ID: {unique_id} (Correlation ID: {correlation_id})')

        try:
            data = json.loads(message.body)
            
            log_with_time('Starting simulation...')
            result = simulate(data)
            log_with_time(f'Simulation completed.')

            if message.reply_to:
                log_with_time(f'Publishing result to reply queue: {message.reply_to} for message ID: {unique_id}')
                        
                serialized_result = serialize_output(result)
        
            
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

async def rabbitmq_listener():
    request_queue = os.getenv('RABBITMQ_REQUEST_QUEUE')
    
    while True:
        try:
            connection = await aio_pika.connect_robust("amqp://localhost")
            log_with_time(f'calc_model -> rabbitmq_listener: Successfully connected to RabbitMQ.')

            async with connection:
                channel = await connection.channel()
                
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
    