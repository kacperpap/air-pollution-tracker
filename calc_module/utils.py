from datetime import datetime
import json

import numpy as np

from models.euler_modified_multibox_model.simulation_types.output_type import OutputType


def log_with_time(message):
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
    print(f'[{now}] {message}')
    

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