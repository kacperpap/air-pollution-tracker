import asyncio
from dataclasses import dataclass
import os
from typing import Dict, List
import pika
import json
from dotenv import load_dotenv # type: ignore

from models.euler_modified_multiboxes_model.Procedural.concentration_simulation import simulate_pollution_spread

load_dotenv()

@dataclass
class PollutionData:
    id: int
    name: str
    latitude: float
    longitude: float
    temperature: float
    wind_speed: float
    wind_direction: int
    pressure: int
    CO: float
    O3: float
    SO2: float
    NO2: float
    flightId: int
    
def convert_backend_flight_data(backend_data: Dict[str, List[Dict]]) -> List[PollutionData]:
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
        
        converted_data.append(PollutionData(**pollution_data))
    
    return converted_data

async def simulate(data, num_steps=1000, dt=1, pollutatns=['CO'], box_size=(None,None), grid_denstiy="medium", urbanized=False, margin_boxes=1, initial_distance=1):
    """_summary_

    Args:
        data (_type_): _description_
        num_steps (int, optional): _description_. Defaults to 1000.
        dt (int, optional): _description_. Defaults to 1.
        pollutatns (list, optional): _description_. Defaults to [].
        box_size (tuple, optional): _description_. Defaults to (None,None).
        grid_denstiy (str, optional): _description_. Defaults to "medium".
        urbanized (bool, optional): _description_. Defaults to False.
        margin_boxes (int, optional): _description_. Defaults to 1.
        initial_distance (int, optional): _description_. Defaults to 1.

    Returns:
        _type_: _description_
    """
    
    converted_data = convert_backend_flight_data(data)
    
    final_concentration = simulate_pollution_spread(converted_data, num_steps, dt, pollutants=pollutatns, box_size=box_size, grid_density=grid_denstiy, urbanized=urbanized, margin_boxes=margin_boxes, initial_distance=initial_distance, debug=True)
    
    return final_concentration

async def rabbitmq_listener():
    
    request_queue = os.getenv('RABBITMQ_REQUEST_QUEUE')
    response_queue = os.getenv('RABBITMQ_RESPONSE_QUEUE')
    
    try:
        connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
        print(f'calc_model -> rabbitmq_listener: Successfully connected to RabbitMQ.')

        channel = connection.channel()
        
        channel.queue_declare(queue=request_queue)
        print(f'calc_model -> rabbitmq_listener: Queue "{request_queue}" declared successfully.')

        channel.queue_declare(queue=response_queue)
        print(f'calc_model -> rabbitmq_listener: Queue "{response_queue}" declared successfully.')

        def callback(ch, method, properties, body):
            print(f'calc_model -> rabbitmq_listener: Received message from queue "{request_queue}".')
        
            data = json.loads(body)
            result = simulate(data)

            channel.basic_publish(
                exchange='',
                routing_key=properties.reply_to,
                body=json.dumps(result),
                properties=pika.BasicProperties(
                    correlation_id=properties.correlation_id
                )
            )
            
            ch.basic_ack(delivery_tag=method.delivery_tag)
            print(f'calc_model -> rabbitmq_listener: Response sent to queue "{response_queue}".')

        channel.basic_consume(queue=request_queue, on_message_callback=callback)
        print(f'calc_model -> rabbitmq_listener: Waiting for messages in "{request_queue}". To exit press CTRL+C')

        channel.start_consuming()

    except Exception as e:
        print(f'calc_model -> rabbitmq_listener: Error connecting to RabbitMQ: {e}')

if __name__ == "__main__":
    print("Starting the listener...")
    asyncio.run(rabbitmq_listener())