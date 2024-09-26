import asyncio
import os
import pika
import json
from dotenv import load_dotenv

load_dotenv()

def simulate_drone_flight(flight_data):
    return {"status": "Simulation complete"}

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
            flight_data = json.loads(body)
            print(f'calc_model -> rabbitmq_listener: Simulating pollution spread for drone flight measurements for flight ID: {flight_data["measurements"][0]['flightId']}')
            result = simulate_drone_flight(flight_data)
            print(f'calc_model -> rabbitmq_listener: Simulation complete for flight ID: {flight_data["measurements"][0]['flightId']}. Sending response to "{response_queue}".')

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