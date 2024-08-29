import { API_URL } from "../../../config";

export const getDroneFlightById = async (flightId: number) => {
    const response = await fetch(`${API_URL}/drone/${flightId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: "include",
    })

    if (response.status !== 200) throw new Error('Get flight by id failed');
    return await response.json();
}