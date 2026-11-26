export const REQUEST_STATUSES = ["Requested", "Assigned", "In Progress", "Completed", "Cancelled"];
export const OPEN_STATUSES = ["Requested", "Assigned", "In Progress"];

const MONEY = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function formatMoney(value) {
    return MONEY.format(Number(value) || 0);
}

export function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function todayInput() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
}

export function slug(value) {
    return String(value || "none").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function initials(name) {
    return String(name || "?")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join("");
}

export function canAssign(request) {
    return ["Requested", "Assigned"].includes(request.status);
}

export function canCharge(request) {
    return request.status !== "Cancelled" && request.paymentStatus !== "Paid";
}

export function errorText(err, fallback) {
    return err?.message || fallback;
}
