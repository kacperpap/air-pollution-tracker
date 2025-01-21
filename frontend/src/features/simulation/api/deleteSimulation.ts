import { API_URL } from "../../../config";

export const deleteSimulation = async (simulationId: number) => {
    const response = await fetch(`${API_URL}/simulation-pollution-spread/${simulationId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: "include",
    });

    if (response.status !== 200 && response.status !== 204) throw new Error('Delete simulation failed');
    return await response.text();
};