import { apiFetch, refreshSession } from "./api";
import { clearSession, getCurrentUser } from "./session";

export async function restoreSession() {
    if (getCurrentUser()) {
        return getCurrentUser();
    }
    try {
        const data = await refreshSession();
        return data.user;
    } catch {
        return null;
    }
}

export async function logout() {
    await apiFetch("/api/auth/logout", { method: "POST", auth: false }).catch(() => null);
    clearSession();
}
