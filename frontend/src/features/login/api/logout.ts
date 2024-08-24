import {API_URL} from "../../../config";

export const logout = async () => {
    const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: "include"
    })

    if(response.status !== 201) throw new Error('Logout failed');
    return await response.text();
}