import { apiFetch } from "../../lib/api";

const BASE = "/api/customer-care";

function query(params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "" && value !== false) {
            search.set(key, String(value));
        }
    });
    const text = search.toString();
    return text ? `?${text}` : "";
}

const get = (path) => apiFetch(`${BASE}${path}`);
const post = (path, body) => apiFetch(`${BASE}${path}`, { method: "POST", body: body || {} });
const patch = (path, body) => apiFetch(`${BASE}${path}`, { method: "PATCH", body: body || {} });
const remove = (path) => apiFetch(`${BASE}${path}`, { method: "DELETE" });

export const salesCare = {
    listCustomers: () => get("/sales/customers"),
    createCustomer: (body) => post("/sales/customers", body),
    getCustomer: (id) => get(`/sales/customers/${id}`),
    updateCustomer: (id, body) => patch(`/sales/customers/${id}`, body),
    addProduct: (id, body) => post(`/sales/customers/${id}/products`, body),
    removeProduct: (id, itemId) => remove(`/sales/customers/${id}/products/${itemId}`),
    sendLogin: (id) => post(`/sales/customers/${id}/portal-link`),
    listRequests: (status) => get(`/sales/service-requests${query({ status })}`),
    assign: (id, body) => post(`/sales/service-requests/${id}/assign`, body),
    setCharge: (id, body) => patch(`/sales/service-requests/${id}/charge`, body),
    listStaff: () => get("/sales/staff"),
    listLeads: () => apiFetch("/api/sales/leads"),
    listCatalogue: () => apiFetch("/api/sales/products"),
};

export const managerCare = {
    listCustomers: (unassigned) => get(`/manager/customers${query({ unassigned })}`),
    setSalesExec: (id, salesExecId) => patch(`/manager/customers/${id}/sales-exec`, { salesExecId }),
    listSalesExecs: () => get("/manager/sales-executives"),
    createFromLead: (leadId, salesExecId) => post(`/manager/leads/${leadId}/create-customer`, { salesExecId }),
    sendLogin: (id) => post(`/manager/customers/${id}/portal-link`),
    listRequests: (status, unassigned) => get(`/manager/service-requests${query({ status, unassigned })}`),
    assign: (id, body) => post(`/manager/service-requests/${id}/assign`, body),
    setCharge: (id, body) => patch(`/manager/service-requests/${id}/charge`, body),
    listStaff: () => get("/manager/staff"),
    listLeads: () => apiFetch("/api/manager/leads?page=1&limit=100"),
};

export const opsCare = {
    listJobs: (status) => get(`/ops/service-requests${query({ status })}`),
    getJob: (id) => get(`/ops/service-requests/${id}`),
    updateStatus: (id, body) => patch(`/ops/service-requests/${id}/status`, body),
};

export const adminCare = {
    listCustomers: () => get("/admin/customers"),
    setPortalAccess: (id, enabled) => patch(`/admin/customers/${id}/portal`, { enabled }),
    sendLogin: (id) => post(`/admin/customers/${id}/portal-link`),
};
