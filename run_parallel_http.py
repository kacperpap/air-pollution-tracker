import requests
from concurrent.futures import ThreadPoolExecutor
import time

# Simulation data directly in the code
SIMULATION_DATA = {
    "droneFlight": {
        "id": 1,
        "title": "Flight over Cracow",
        "description": "Flight over Cracow on 28th September at 12 o'clock",
        "date": "2024-08-29T00:00:00.000Z",
        "userId": 1,
        "measurements": [
            {
                "id": 27,
                "name": "Point 1 - Wawel",
                "latitude": 50.0545,
                "longitude": 19.9353,
                "temperature": 22.5,
                "windSpeed": 2.5,
                "windDirection": 45,
                "pressure": 101825,
                "flightId": 1,
                "pollutionMeasurements": [
                    {"id": 77, "type": "CO", "value": 5234, "measurementId": 27},
                    {"id": 78, "type": "O3", "value": 68.4, "measurementId": 27},
                    {"id": 79, "type": "SO2", "value": 129.5, "measurementId": 27},
                    {"id": 80, "type": "NO2", "value": 132.5, "measurementId": 27}
                ]
            },
            {
                "id": 28,
                "name": "Point 2 - Main Square",
                "latitude": 50.0614,
                "longitude": 19.9372,
                "temperature": 23.1,
                "windSpeed": 3,
                "windDirection": 90,
                "pressure": 101125,
                "flightId": 1,
                "pollutionMeasurements": [
                    {"id": 81, "type": "CO", "value": 7894, "measurementId": 28},
                    {"id": 82, "type": "O3", "value": 75.2, "measurementId": 28},
                    {"id": 83, "type": "SO2", "value": 112.1, "measurementId": 28},
                    {"id": 84, "type": "NO2", "value": 128.9, "measurementId": 28}
                ]
            },
            {
                "id": 29,
                "name": "Point 3 - Kazimierz",
                "latitude": 50.0487,
                "longitude": 19.9445,
                "temperature": 22.8,
                "windSpeed": 1.8,
                "windDirection": 60,
                "pressure": 101437,
                "flightId": 1,
                "pollutionMeasurements": [
                    {"id": 85, "type": "CO", "value": 8900.6, "measurementId": 29},
                    {"id": 86, "type": "O3", "value": 63.9, "measurementId": 29},
                    {"id": 87, "type": "SO2", "value": 141.4, "measurementId": 29},
                    {"id": 88, "type": "NO2", "value": 135.6, "measurementId": 29}
                ]
            },
            {
                "id": 30,
                "name": "Point 4 - Vistula River",
                "latitude": 50.051,
                "longitude": 19.9366,
                "temperature": 22.3,
                "windSpeed": 1.8,
                "windDirection": 62,
                "pressure": 100987,
                "flightId": 1,
                "pollutionMeasurements": [
                    {"id": 89, "type": "CO", "value": 4897.7, "measurementId": 30},
                    {"id": 90, "type": "O3", "value": 70.6, "measurementId": 30},
                    {"id": 91, "type": "SO2", "value": 156.9, "measurementId": 30},
                    {"id": 92, "type": "NO2", "value": 119.8, "measurementId": 30}
                ]
            }
        ]
    },
    "numSteps": 10000,
    "pollutants": ["CO"],
    "gridDensity": "medium",
    "urbanized": False,
    "marginBoxes": 1,
    "initialDistance": 1,
    "decayRate": 0.01,
    "emissionRate": 0.01,
    "snapInterval": 10
}

def get_auth_cookies():
    """Get authentication cookies"""
    auth_response = requests.post(
        'http://localhost:9000/api/auth/login',
        auth=('kacper@example.com', 'kacper123')
    )
    return auth_response.cookies

def send_simulation_request(cookies):
    """Send single simulation request"""
    response = requests.post(
        'http://localhost:9000/api/simulation-pollution-spread/droneFlight/',
        json=SIMULATION_DATA,
        cookies=cookies
    )
    return response.status_code == 200

def run_parallel_simulations(num_requests):
    cookies = get_auth_cookies()
    
    print(f"Starting {num_requests} parallel requests...")
    start_time = time.time()
    
    with ThreadPoolExecutor(max_workers=num_requests) as executor:
        futures = [
            executor.submit(send_simulation_request, cookies)
            for _ in range(num_requests)
        ]
        
        results = [future.result() for future in futures]
    
    end_time = time.time()
    success_count = sum(1 for r in results if r)
    
    print(f"Completed in {end_time - start_time:.2f} seconds")
    print(f"Successful requests: {success_count}/{num_requests}")

if __name__ == "__main__":
    run_parallel_simulations(4)  