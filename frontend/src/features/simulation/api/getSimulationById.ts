import { API_URL } from "../../../config";
import { SimulationType } from "../../../types/SimulationType";

export const getSimulationById = async (simulationId: number): Promise<SimulationType> => {
    const response = await fetch(`${API_URL}/simulation-pollution-spread/${simulationId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: "include",
    });

    if (response.status !== 200) throw new Error('Get simulation by id failed');
    return await response.json();
};