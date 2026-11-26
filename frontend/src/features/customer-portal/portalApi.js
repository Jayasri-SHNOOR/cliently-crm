import { getPublicSite } from "../public-site/publicSiteApi";

const API_URL = import.meta.env.VITE_API_URL;

let accessToken = null;
let currentProfile = null;
let refreshInFlight = null;

export class PortalError extends Error {
    constructor(message, status, { code = null, retryAfter = 0 } = {}) {
        super(message);
        this.status = status;
        this.code = code;
        this.retryAfter = retryAfter;
    }
}

async function send(path, { method = "GET", body, token } = {}) {
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;

    let response;
    try {
        response = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
            credentials: "include",
        });
    } catch {
        throw new PortalError("Cannot reach the server. Please try again.", 0);
    }

    if (response.status === 204) return null;

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new PortalError(data.message || `Request failed (${response.status})`, response.status, {
            code: data.code || null,
            retryAfter: Number(response.headers.get("Retry-After")) || 0,
        });
    }
    return data;
}

function saveSession(data) {
    accessToken = data?.accessToken || null;
    currentProfile = data?.customer || null;
    return currentProfile;
}

function clearPortalSession() {
    accessToken = null;
    currentProfile = null;
}

export function getProfile() {
    return currentProfile;
}

export async function getSite(slug) {
    const response = await getPublicSite(slug);
    return response?.data || null;
}

export function restoreSession() {
    if (!refreshInFlight) {
        refreshInFlight = send("/api/portal/auth/refresh", { method: "POST" })
            .then((data) => (data ? saveSession(data) : (clearPortalSession(), null)))
            .catch((err) => {
                clearPortalSession();
                if (err.status === 401 || err.status === 403) return null;
                throw err;
            })
            .finally(() => {
                refreshInFlight = null;
            });
    }
    return refreshInFlight;
}

export async function portalFetch(path, options = {}) {
    if (!accessToken) {
        const profile = await restoreSession();
        if (!profile) throw new PortalError("Please log in.", 401, { code: "NO_SESSION" });
    }
    try {
        return await send(path, { ...options, token: accessToken });
    } catch (err) {
        if (err.code !== "TOKEN_EXPIRED") throw err;
    }
    const profile = await restoreSession();
    if (!profile) throw new PortalError("Please log in.", 401, { code: "NO_SESSION" });
    return send(path, { ...options, token: accessToken });
}

export function checkActivation(slug, token) {
    return send("/api/portal/auth/activate/check", { method: "POST", body: { slug, token } });
}

export function activateAccount(slug, token, password) {
    return send("/api/portal/auth/activate", { method: "POST", body: { slug, token, password } });
}

export async function loginCustomer(slug, loginId, password) {
    const data = await send("/api/portal/auth/login", { method: "POST", body: { slug, loginId, password } });
    return saveSession(data);
}

export async function logoutCustomer() {
    try {
        await send("/api/portal/auth/logout", { method: "POST" });
    } finally {
        clearPortalSession();
    }
}

export function listMyProducts() {
    return portalFetch("/api/portal/products");
}

export function getServiceTypes() {
    return portalFetch("/api/portal/service-types");
}

export function listMyRequests() {
    return portalFetch("/api/portal/service-requests");
}

export function getMyRequest(id) {
    return portalFetch(`/api/portal/service-requests/${encodeURIComponent(id)}`);
}

export function createServiceRequest(body) {
    return portalFetch("/api/portal/service-requests", { method: "POST", body });
}

export function cancelServiceRequest(id, reason) {
    return portalFetch(`/api/portal/service-requests/${encodeURIComponent(id)}/cancel`, { method: "POST", body: { reason } });
}

export function startPayment(id) {
    return portalFetch(`/api/portal/service-requests/${encodeURIComponent(id)}/pay`, { method: "POST", body: {} });
}

export function verifyPayment(details) {
    return portalFetch("/api/portal/payments/verify", { method: "POST", body: details });
}

export function reportPaymentFailure(details) {
    return portalFetch("/api/portal/payments/failed", { method: "POST", body: details }).catch(() => null);
}

export async function updateProfile(body) {
    const data = await portalFetch("/api/portal/profile", { method: "PATCH", body });
    if (data?.customer) currentProfile = data.customer;
    return data;
}

export function changePassword(currentPassword, newPassword) {
    return portalFetch("/api/portal/change-password", { method: "POST", body: { currentPassword, newPassword } });
}

let razorpayLoading = null;

export function loadRazorpay() {
    if (window.Razorpay) return Promise.resolve();
    if (!razorpayLoading) {
        razorpayLoading = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve();
            script.onerror = () => {
                razorpayLoading = null;
                reject(new PortalError("Could not open the payment window. Check your internet connection.", 0));
            };
            document.body.appendChild(script);
        });
    }
    return razorpayLoading;
}

export function checkPasswordRules(password) {
    if (password.length < 8) return "Password must be at least 8 characters";
    if (password.length > 128) return "Password must be 128 characters or less";
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        return "Password must contain at least one letter and one number";
    }
    return "";
}

export function formatLoginId(value) {
    const clean = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}

export function initials(name) {
    return String(name || "?")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join("");
}

const MONEY = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function formatMoney(value) {
    return MONEY.format(Number(value) || 0);
}

export function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
export function statusClass(status) {
    return String(status || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}
