import { getAccessToken, setSession, clearSession } from "./session";

const API_URL = import.meta.env.VITE_API_URL;

export const SESSION_ENDED_CODES = [
    "NO_SESSION",
    "NO_TOKEN",
    "INVALID_TOKEN",
    "SESSION_IDLE",
    "SESSION_EXPIRED",
    "SESSION_REVOKED",
    "USER_INACTIVE",
    "TENANT_INACTIVE",
];

export class ApiError extends Error {
    constructor(message, status, { code = null, retryAfter = 0, errors = null } = {}) {
        super(message);
        this.status = status;
        this.code = code;
        this.retryAfter = retryAfter;
        this.errors = errors;
    }
}

async function send(path, { method = "GET", body, token } = {}) {
    const headers = {};
    if (body !== undefined) {
        headers["Content-Type"] = "application/json";
    }
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
            credentials: "include",
        });
    } catch {
        throw new ApiError("Cannot reach the server. Is the backend running?", 0);
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new ApiError(data.message || `Request failed (${response.status})`, response.status, {
            code: data.code || null,
            retryAfter: Number(response.headers.get("Retry-After")) || 0,
            errors: data.errors || null,
        });
    }
    return data;
}

let refreshInFlight = null;

export function refreshSession() {
    if (!refreshInFlight) {
        refreshInFlight = send("/api/auth/refresh", { method: "POST" })
            .then((data) => {
                setSession(data);
                return data;
            })
            .finally(() => {
                refreshInFlight = null;
            });
    }
    return refreshInFlight;
}

export function endSession(reason) {
    clearSession();
    if (window.location.pathname !== "/login") {
        window.location.replace(`/login?reason=${encodeURIComponent(reason || "SESSION_ENDED")}`);
    }
}

function handleAuthFailure(err) {
    if (SESSION_ENDED_CODES.includes(err.code)) {
        endSession(err.code);
    }
    throw err;
}

export async function apiFetch(path, options = {}) {
    const { auth = true, ...request } = options;
    if (!auth) {
        return send(path, request);
    }

    try {
        if (!getAccessToken()) {
            await refreshSession();
        }
        return await send(path, { ...request, token: getAccessToken() });
    } catch (err) {
        if (err.code !== "TOKEN_EXPIRED") {
            return handleAuthFailure(err);
        }
    }

    try {
        await refreshSession();
        return await send(path, { ...request, token: getAccessToken() });
    } catch (err) {
        return handleAuthFailure(err);
    }
}
