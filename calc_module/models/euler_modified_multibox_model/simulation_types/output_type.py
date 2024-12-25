from typing import List, TypedDict, Dict, Union, Optional

import numpy as np

class Box(TypedDict):
    lat_min: float
    lat_max: float
    lon_min: float
    lon_max: float

class Grid(TypedDict):
    boxes: List[Box]

class StepPollutants(TypedDict):
    CO: Optional[List[float]]
    O3: Optional[List[float]]
    NO2: Optional[List[float]]
    SO2: Optional[List[float]]

class PollutantsData(TypedDict):
    steps: Dict[int, StepPollutants]
    final_step: StepPollutants

class Environment(TypedDict):
    temperature: List[float]
    pressure: List[float]
    windSpeed: List[float]
    windDirection: List[float]

class OutputType(TypedDict):
    grid: Grid
    pollutants: PollutantsData
    environment: Environment

def convert_to_output_type(
    concentration_data: Dict[str, List[float]], 
    snap_concentrations: Dict[str, List[List[float]]],
    boxes: List[tuple],
    temp_values: List[float],
    press_values: List[float],
    u_values: List[float],
    v_values: List[float]
) -> OutputType:
  
    formatted_boxes = [
        {
            "lat_min": box[0],
            "lat_max": box[1],
            "lon_min": box[2],
            "lon_max": box[3]
        }
        for box in boxes
    ]

    wind_speed = []
    wind_direction = []
    for u, v in zip(u_values, v_values):
        speed = (u**2 + v**2)**0.5
        
        # direction need to be parsed back as azymuth
        math_angle = np.degrees(np.arctan2(u, v))
        azimuth = (90 - math_angle) % 360
        
        wind_speed.append(speed)
        wind_direction.append(azimuth)

    output_data: OutputType = {
        "grid": {
            "boxes": formatted_boxes
        },
        "pollutants": {
            "steps": {}
        },
        "environment": {
            "temperature": temp_values,
            "pressure": press_values,
            "windSpeed": list(wind_speed),
            "windDirection": list(wind_direction)
        }
    }
    
    num_steps = len(next(iter(snap_concentrations.values())))
    for step_idx in range(num_steps):
        output_data["pollutants"]["steps"][step_idx] = {
            pollutant: snap_concentrations[pollutant][step_idx]
            for pollutant in snap_concentrations
        }


    output_data["pollutants"]["final_step"] = {
        pollutant: concentrations.tolist() if isinstance(concentrations, np.ndarray) else concentrations
        for pollutant, concentrations in concentration_data.items()
    }


    return output_data


# Dane zwracane z symulacji

"""
[
    {
        "id": 0,
        "CO": ,
        "O3": 
    },
    ...
    {
        "id": LAST_BOX_ID,
        "CO": ,
        "O3": 
    }
]
"""


#Dane zwracane przez calc_module do backendu

"""
{
    "grid": {
        "boxes": [
            {"lat_min": , "lat_max": , "lon_min": , "lon_max": },
            {"lat_min": , "lat_max": , "lon_min": , "lon_max": },
            ...
        ]
    },
    "pollutants": {
        "step_ID" : {
            "CO":   [...],
            "O3":   [...],
            "NO2":  [...],
        ... 
        },
        ...
        "final_step_ID" : {
            "CO":   [...],
            "O3":   [...],
            "NO2":  [...],
        ... 
        }
        
    },
    "environment": {
        "temperature": [...],
        "pressure": [...],
        "windSpeed": [...],
        "windDirection": [...]
    }
}
"""
