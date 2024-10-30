import { SimulationRequestType } from '../../../types/SimulationRequestType';
import { API_URL } from "../../../config";


export const simulatePollutionSpread = async (simulationData: SimulationRequestType) => {
    
    const response = await fetch(`${API_URL}/simulation-pollution-spread/droneFlight`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(simulationData), 
      credentials: "include",
    });
  
    if (response.status !== 201) throw new Error('Simulation failed');
    return await response.json();
  };
  
