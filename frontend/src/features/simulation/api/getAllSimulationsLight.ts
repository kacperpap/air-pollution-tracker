import { API_URL } from "../../../config";

export const getAllSimulationsLight = async () => {
    const response = await fetch(`${API_URL}/simulation-pollution-spread/light`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: "include",
    });

    if (response.status !== 200) throw new Error('Get all simulations failed');
    return await response.json();
};