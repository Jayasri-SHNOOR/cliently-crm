import { apiFetch } from "../../lib/api";

const PROFILE_URL = "/api/super-admin/profile";

function readProfile(result) {
  if (!result?.user || !result.user._id) {
    throw new Error("Invalid profile response.");
  }

  return result.user;
}

export async function fetchProfile() {
  const result = await apiFetch(PROFILE_URL);
  return readProfile(result);
}

export async function updateProfile({ name, mobileNumber }) {
  const result = await apiFetch(PROFILE_URL, {
    method: "PATCH",
    body: {
      name,
      mobileNumber
    }
  });

  return readProfile(result);
}

export async function fetchOwnSessions() {
  const result = await apiFetch(`${PROFILE_URL}/sessions`);

  if (!Array.isArray(result?.sessions)) {
    throw new Error("Invalid session response.");
  }

  return result.sessions;
}

export async function revokeOwnSession(id) {
  return apiFetch(
    `${PROFILE_URL}/sessions/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
}


export async function fetchOwnActivity() {
  const result = await apiFetch(`${PROFILE_URL}/activity`);

  if (!Array.isArray(result?.activity)) {
    throw new Error("Invalid activity response.");
  }

  return result.activity;
}
