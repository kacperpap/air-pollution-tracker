import { API_URL } from "../../../config";

export const deleteDroneFlight = async (flightId: number) => {
    const response = await fetch(`${API_URL}/drone/${flightId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: "include",
    })

    if (response.status !== 200 && response.status !== 204) throw new Error('Delete failed');
    return await response.text();
}