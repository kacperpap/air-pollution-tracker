import { API_URL } from "../../../config";
import { DroneFlightFormType } from "../../../types/DroneFlightFormType";

export const editDroneFlight = async (editInput: DroneFlightFormType, flightId: number) => {
    const response = await fetch(`${API_URL}/drone/${flightId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: "include",
        body: JSON.stringify(editInput)
    })

    if(response.status !== 201) throw new Error('Edit failed');
    return await response.text();
}