import pika
import json
from fastapi import FastAPI, BackgroundTasks

app = FastAPI()

def simulate_drone_flight(flight_data):
    return {"status": "Simulation complete", "flight_id": flight_data['id']}

def rabbitmq_listener():
    connection = pika.BlockingConnection(pika.ConnectionParameters('localhost'))
    channel = connection.channel()

    channel.queue_declare(queue='simulation_queue')

    def callback(ch, method, properties, body):
        flight_data = json.loads(body)
        simulate_drone_flight(flight_data) 

    channel.basic_consume(queue='simulation_queue', on_message_callback=callback, auto_ack=True)

    channel.start_consuming()

# Endpoint do uruchomienia w tle nasłuchu RabbitMQ
# uvicorn main:app --reload

@app.lifespan("startup")
async def startup_event():
    rabbitmq_listener()
