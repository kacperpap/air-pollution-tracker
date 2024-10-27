from typing import List, TypedDict, Dict

class PollutionMeasurement(TypedDict):
    type: str
    value: float

class Measurement(TypedDict):
    id: int
    name: str
    latitude: float
    longitude: float
    temperature: float
    windSpeed: float
    windDirection: float
    pressure: float
    pollutionMeasurements: List[PollutionMeasurement]
    flightId: int

class InputType(TypedDict):
    measurements: List[Measurement]
    
    
def convert_to_input_type(backend_data: Dict):
    
    drone_flight = backend_data['droneFlight'] 
    measurements = drone_flight['measurements']

    converted_data = []
    
    for measurement in measurements:
        
        pollution_data = {
            'id': measurement['id'],
            'name': measurement['name'],
            'latitude': measurement['latitude'],
            'longitude': measurement['longitude'],
            'temperature': measurement['temperature'],
            'windSpeed': measurement['windSpeed'],
            'windDirection': measurement['windDirection'],
            'pressure': measurement['pressure'],
            'flightId': drone_flight['id']
        }
        
        for pollutant in measurement['pollutionMeasurements']:
            pollution_data[pollutant['type']] = pollutant['value']
        
        converted_data.append(pollution_data)
    
    return converted_data



### DANE ZWRACANE POPRZEZ GET /api/drone/{:id}

"""
{
    "id": ,
    "title": "",
    "description": "",
    "date": "YYYY-MM-DDT00:00:00.000Z",
    "userId": ,
    "measurements": [
        {
            "id": 1,
            "name": "",
            "latitude": ,
            "longitude": ,
            "temperature": ,
            "windSpeed": ,
            "windDirection":,
            "pressure": ,
            "flightId": ,
            "pollutionMeasurements": [
                {
                    "id": 1,
                    "type": "CO",
                    "value": ,
                    "measurementId": 1
                },
                {
                    "id": 2,
                    "type": "O3",
                    "value": ,
                    "measurementId": 1
                },
                {
                    "id": 3,
                    "type": "SO2",
                    "value": ,
                    "measurementId": 1
                },
                {
                    "id": 4,
                    "type": "NO2",
                    "value": ,
                    "measurementId": 1
                }
            ]
        },
        ...
    ]
}
"""

### DANE PRZEKAZYWANE PO KONWERSJI DO SYMULACJI
""" 
{
    'measurements': [
        {
            'id': ,
            'name': '',
            'latitude': ,
            'longitude': ,
            'temperature': ,
            'windSpeed': ,
            'windDirection': ,
            'pressure': ,
            'pollutionMeasurements': [
                {
                    'type': 'CO',
                    'value': 
                },
                {
                    'type': 'O3',
                    'value': 
                },
                {
                    'type': 'SO2',
                    'value': 
                },
                {
                    'type': 'NO2',
                    'value': 
                }
            ],
            'flightId': 
        },
        ...
    ]
}
"""