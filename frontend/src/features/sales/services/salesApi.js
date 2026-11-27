import { apiFetch } from "../../../lib/api";

const get = (path) => apiFetch(`/api/sales${path}`);
const send = (method) => (path, body) => apiFetch(`/api/sales${path}`, { method, body: body || {} });
const post = send("POST");
const put = send("PUT");
const patch = send("PATCH");
const remove = (path) => apiFetch(`/api/sales${path}`, { method: "DELETE" });

export const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Demo", "Proposal", "Negotiation", "Won", "Lost"];
export const TASK_STATUSES = ["Pending", "In Progress", "Completed"];
export const PRIORITIES = ["High", "Medium", "Low"];

export const salesApi = {
    dashboard: () => get("/dashboard"),

    leads: () => get("/leads"),
    createLead: (body) => post("/leads", body),
    updateLead: (id, body) => put(`/leads/${id}`, body),
    deleteLead: (id) => remove(`/leads/${id}`),

    tasks: () => get("/tasks"),
    createTask: (body) => post("/tasks", body),
    updateTask: (id, body) => put(`/tasks/${id}`, body),
    deleteTask: (id) => remove(`/tasks/${id}`),

    meetings: () => get("/calendar"),
    createMeeting: (body) => post("/calendar", body),
    updateMeeting: (id, body) => put(`/calendar/${id}`, body),
    deleteMeeting: (id) => remove(`/calendar/${id}`),

    notes: () => get("/notes"),
    createNote: (body) => post("/notes", body),
    updateNote: (id, body) => put(`/notes/${id}`, body),
    deleteNote: (id) => remove(`/notes/${id}`),

    products: () => get("/products"),
    payments: () => get("/payments"),

    profile: () => get("/profile"),
    updateProfile: (body) => patch("/profile", body),
};

export function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "—"
        : date.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function toDateInput(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toDateTimeInput(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${toDateInput(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function errorMessage(err, fallback = "Something went wrong. Please try again.") {
    return err?.message || fallback;
}
