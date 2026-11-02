import { apiFetch } from "../../../lib/api";

const api = {
  get: (endpoint) => apiFetch(endpoint),

  post: (endpoint, data) =>
    apiFetch(endpoint, {
      method: "POST",
      body: data,
    }),

  put: (endpoint, data) =>
    apiFetch(endpoint, {
      method: "PUT",
      body: data,
    }),

  delete: (endpoint) =>
    apiFetch(endpoint, {
      method: "DELETE",
    }),
};

export default api;