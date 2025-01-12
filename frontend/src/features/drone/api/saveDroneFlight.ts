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

    if(response.status !== 201) {
        let errorMessage = 'Save failed';
        
        try {
            const errorData = await response.json();
            if (errorData && errorData.message) {
                errorMessage = `Save failed: ${errorData.message}`;
            }
        } catch (err) {
            errorMessage = `Save failed with status ${response.status}`;
        }

        throw new Error(errorMessage);
    }
    return await response.text();
}