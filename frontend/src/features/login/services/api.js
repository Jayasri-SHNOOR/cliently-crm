const API_URL = import.meta.env.VITE_API_URL;
export class ApiError extends Error{
    constructor(message, status, retryAfter=0){
        super(message);
        this.status = status;
        this.retryAfter = retryAfter;
    }
}

export async function api(path,{method = "GET", body, token} = {}){
    const headers = {};
    if(body !== undefined){
        headers["Content-Type"] = "application/json";
    }
    if(token){
        headers.Authorization = `Bearer ${token}`;
    }
    let response;
    try{
        response = await fetch(`${API_URL}${path}`,{
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    }catch{
        throw new ApiError("Cannot reach the server.", 0);
    }

    const data = await response.json().catch(() => ({}));
    if(!response.ok){
        const retryAfter = Number(response.headers.get("Retry-After")) || 0;
        throw new ApiError(data.message || `Request failed (${response.status})`, response.status, retryAfter);
    }
    return data;
}