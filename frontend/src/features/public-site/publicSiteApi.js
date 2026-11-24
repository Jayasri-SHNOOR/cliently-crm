import { apiFetch } from "../../lib/api";

export function getPublicSite(slug) {
  return apiFetch(`/api/public/sites/${encodeURIComponent(slug)}`, { auth: false });
}

export function sendEnquiry(slug, body) {
  return apiFetch(`/api/public/sites/${encodeURIComponent(slug)}/enquiries`, {
    method: "POST",
    body,
    auth: false,
  });
}