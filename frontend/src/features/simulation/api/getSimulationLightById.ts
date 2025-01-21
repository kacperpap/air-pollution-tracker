import { API_URL } from "../../../config";

export const getSimulationLightById = async (simulationId: number) => {
    const response = await fetch(`${API_URL}/simulation-pollution-spread/light/${simulationId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: "include",
    });

    if (response.status !== 200) throw new Error('Get simulation light by failed');
    return await response.json();
};