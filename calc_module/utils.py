import json
import logging
import threading
from typing import Any, Dict, Union

import numpy as np

from models.euler_modified_multibox_model.simulation_types.output_type import OutputType

##############################################################################################
#                                 Logger function                                            #
##############################################################################################

_context = threading.local()

def set_context_id(context_id: int):
    _context.context_id = context_id

def get_context_id() -> Union[int, str]:
    return getattr(_context, 'context_id', 'N/A')

class ContextFormatter(logging.Formatter):
    def format(self, record):
        if not hasattr(record, 'context_id'):
            record.context_id = 'N/A'
        return super().format(record)

class ContextLogger(logging.getLoggerClass()):
    def makeRecord(self, name, level, fn, lno, msg, args, exc_info, func=None, extra=None, sinfo=None):
        record = super().makeRecord(name, level, fn, lno, msg, args, exc_info, func, extra, sinfo)
        record.context_id = get_context_id()
        return record

logging.setLoggerClass(ContextLogger)

formatter = ContextFormatter('%(asctime)s - %(levelname)s - Context %(context_id)s - %(message)s')

handler = logging.StreamHandler()
handler.setFormatter(formatter)

root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)

for h in root_logger.handlers[:]:
    root_logger.removeHandler(h)
root_logger.addHandler(handler)

aio_pika_logger = logging.getLogger('aio_pika')
for h in aio_pika_logger.handlers[:]:
    aio_pika_logger.removeHandler(h)
aio_pika_logger.addHandler(handler)

logger = logging.getLogger(__name__)

def log_with_time(message: str, level: str = 'info'):
    """
    Log message with timestamp and additional context.
    """
    log_func = {
        'info': logger.info,
        'warning': logger.warning,
        'error': logger.error,
        'debug': logger.debug,
        'critical': logger.critical
    }.get(level.lower(), logger.info)

    log_func(message)
    
    

##############################################################################################
#                            Serialization function                                          #
##############################################################################################    

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