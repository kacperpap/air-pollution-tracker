import { API_URL } from "../../../config";

export const login = async (username: string, password: string) => {

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const timezoneOffset = new Date().getTimezoneOffset();

    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + window.btoa(username + ":" + password),
        },
        credentials: "include",
        mode: "cors",
        body: JSON.stringify({ timezone, timezoneOffset })
    })

    if(response.status !== 200) throw new Error('Login failed');
    return await response.text();
}