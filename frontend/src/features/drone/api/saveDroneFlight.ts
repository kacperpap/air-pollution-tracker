import { API_URL } from "../../../config";
import { DroneFlightFormType } from "../../../types/DroneFlightFormType";

export const saveDroneFlight = async (dataInput: DroneFlightFormType) => {
    const response = await fetch(`${API_URL}/drone`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: "include",
        body: JSON.stringify(dataInput)
    })

    if(response.status !== 201) throw new Error('Save failed');
    return await response.text();
}