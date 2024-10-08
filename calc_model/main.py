import asyncio
from dataclasses import dataclass
from datetime import datetime
import time
import os
import traceback
from typing import Dict, List
import aio_pika
import json
import uuid
import numpy as np
from dotenv import load_dotenv # type: ignore

from models.euler_modified_multiboxes_model.Procedural.concentration_simulation import simulate_pollution_spread

load_dotenv()
    
def log_with_time(message):
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
    print(f'[{now}] {message}')
    
def convert_backend_flight_data(backend_data: Dict[str, List[Dict]]):
    converted_data = []
    for measurement in backend_data['measurements']:
        pollution_data = {
            'id': measurement['id'],
            'name': measurement['name'],
            'latitude': measurement['latitude'],
            'longitude': measurement['longitude'],
            'temperature': measurement['temperature'],
            'windSpeed': measurement['windSpeed'],
            'windDirection': measurement['windDirection'],
            'pressure': measurement['pressure'],
            'flightId': measurement['flightId']
        }
        
        for pollutant in measurement['pollutionMeasurements']:
            pollution_data[pollutant['type']] = pollutant['value']
        
        for pollutant in ['CO', 'O3', 'SO2', 'NO2']:
            if pollutant not in pollution_data:
                pollution_data[pollutant] = 0.0
        
        converted_data.append(pollution_data)
    
    return converted_data

def numpy_to_list(obj):
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, np.float64):
        return float(obj)
    return obj

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
        converted_data = convert_backend_flight_data(data)
        
        log_with_time(f"simulate -> starting function simulate_pollution_spread with parameters: "
                      f"num_steps={num_steps}, dt={dt}, pollutants={pollutatns}, "
                      f"box_size={box_size}, grid_density={grid_denstiy}, "
                      f"urbanized={urbanized}, margin_boxes={margin_boxes}, initial_distance={initial_distance}")
        
        start_time = time.time()

        final_concentration = simulate_pollution_spread(
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

        return final_concentration

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
            log_with_time(f'Message content: {data}')
            
            log_with_time('Starting simulation...')
            result = simulate(data)
            log_with_time(f'Simulation completed. Result: {result}')

            if message.reply_to:
                log_with_time(f'Publishing result to reply queue: {message.reply_to} for message ID: {unique_id}')
                        
                serializable_result = json.loads(json.dumps(result, default=numpy_to_list))
        
            
                await channel.default_exchange.publish(
                    aio_pika.Message(
                        body=json.dumps(serializable_result).encode(),
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
    
    
    
    
    
    
    
    
    
    
    
    
# # NOT ASYNCHRONOUS 
# async def process_message(channel, method, properties, body):
    
#     correlation_id = properties.correlation_id
#     unique_id = str(uuid.uuid4())
       
#     log_with_time(f'Processing message with ID: {unique_id} (Correlation ID: {correlation_id})')

#     try:
#         data = json.loads(body)
#         log_with_time(f'Message content: {data}')
        
#         log_with_time('Starting simulation...')
#         result = simulate(data)
#         log_with_time(f'Simulation completed. Result: {result}')

#         log_with_time(f'Publishing result for message ID: {unique_id}')
#         channel.basic_publish(
#             exchange='',
#             routing_key=properties.reply_to,
#             body=json.dumps(result), 
#             properties=pika.BasicProperties(correlation_id=properties.correlation_id)
#         )
#         log_with_time(f'Result published for message ID: {unique_id}')

#         channel.basic_ack(delivery_tag=method.delivery_tag)
#         log_with_time(f'Message acknowledged: {unique_id}')

#     except Exception as e:
#         log_with_time(f'Error processing message {unique_id}: {str(e)}')
#         log_with_time(f'Traceback: {traceback.format_exc()}')
#         channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

# async def rabbitmq_listener():
    
#     request_queue = os.getenv('RABBITMQ_REQUEST_QUEUE')
     
#     while True:   
#         try:
#             connection = await asyncio.get_event_loop().run_in_executor(
#                 None, lambda: pika.BlockingConnection(pika.ConnectionParameters('localhost'))
#             )
#             log_with_time(f'calc_model -> rabbitmq_listener: Successfully connected to RabbitMQ.')

#             channel = await asyncio.get_event_loop().run_in_executor(
#                 None, connection.channel
#             )
            
#             await asyncio.get_event_loop().run_in_executor(
#                 None, lambda: channel.queue_declare(queue=request_queue, durable=False)
#             )
#             log_with_time(f'calc_model -> rabbitmq_listener: Queue "{request_queue}" declared successfully.')
            
#             await asyncio.get_event_loop().run_in_executor(
#                 None, lambda: channel.basic_qos(prefetch_count=1)
#             )

#             def callback(ch, method, properties, body):
#                 asyncio.create_task(process_message(ch, method, properties, body))
            
#             await asyncio.get_event_loop().run_in_executor(
#                 None, lambda: channel.basic_consume(queue=request_queue, on_message_callback=callback)
#             )
#             log_with_time(f'calc_model -> rabbitmq_listener: Waiting for messages in "{request_queue}".')

#             # Use run_in_executor to run start_consuming in a separate thread
#             await asyncio.get_event_loop().run_in_executor(None, channel.start_consuming)

#         except Exception as e:
#             log_with_time(f'calc_model -> rabbitmq_listener: Error connecting to RabbitMQ: {e}')
#             await asyncio.sleep(5)  # Wait before trying to reconnect