import axios from "axios";
import { getAccessToken } from "../../../lib/session";
import { refreshSession, endSession, SESSION_ENDED_CODES } from "../../../lib/api";

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`,
});

api.interceptors.request.use(async (config) => {
    if (!getAccessToken()) {
        await refreshSession().catch(() => null);
    }
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { config, response } = error;
        const code = response?.data?.code;

        if (code === "TOKEN_EXPIRED" && config && !config._retried) {
            config._retried = true;
            try {
                await refreshSession();
                config.headers.Authorization = `Bearer ${getAccessToken()}`;
                return api(config);
            } catch (refreshError) {
                if (SESSION_ENDED_CODES.includes(refreshError.code)) {
                    endSession(refreshError.code);
                }
                return Promise.reject(refreshError);
            }
        }

        if (SESSION_ENDED_CODES.includes(code)) {
            endSession(code);
        }
        return Promise.reject(error);
    }
);

export default api;
