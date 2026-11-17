const BASE_URL = "http://localhost:5000/api/super-admin/tenants";

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success === false) {
    throw new Error(result.message || `Request failed: ${response.status}`);
  }
  return result;
}

export const tenantsApi = {
  list: () => request(BASE_URL),
  create: (data) => request(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }),
  update: (id, data) => request(`${BASE_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }),
  remove: (id) => request(`${BASE_URL}/${id}`, {
    method: "DELETE",
  }),
};
