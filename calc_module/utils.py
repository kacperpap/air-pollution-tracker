from datetime import datetime
import json
from typing import Any, Dict, Union

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
    

def serialize_output(output_data: Union[OutputType, Dict[str, Any]]) -> str:
    """
    Serializes the output data to JSON format after converting NumPy types.
    
    Args:
        output_data: The output data, either in OutputType format or a dictionary 
                     containing status and result.
        
    Returns:
        str: Serialized JSON data as a string.
    """
    try:
        if isinstance(output_data, dict) and 'status' in output_data:
            if output_data.get('result') is not None:
                serialized_result = json.dumps(output_data, cls=NpEncoder)
            else:
                serialized_result = json.dumps(output_data)
        else:
            serialized_result = json.dumps(output_data, cls=NpEncoder)
        
        log_with_time(f"Serialized data types: {str(type(output_data))}")
        
        return serialized_result
    except Exception as e:
        log_with_time(f"Error during serialization: {str(e)}")
        raise