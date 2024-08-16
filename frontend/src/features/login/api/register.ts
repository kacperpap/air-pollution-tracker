import { API_URL } from "../../../config";
import { RegisterFormType } from "../../../types/RegisterFormType";


export const register = async (data: RegisterFormType) => {
    const response = await fetch(`${API_URL}/user`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    })

    if(response.status !== 200) throw new Error('Register failed');
    return await response.text();
}