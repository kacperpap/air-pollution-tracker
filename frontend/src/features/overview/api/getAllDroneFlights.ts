import { API_URL } from "../../../config";

export const getAllDroneFlights = async () => {
    const response = await fetch(`${API_URL}/drone/`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: "include",
    })

    if (response.status !== 200) throw new Error('Get all flights failed');
    return await response.json();
}