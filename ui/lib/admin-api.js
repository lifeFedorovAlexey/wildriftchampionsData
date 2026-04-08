import { buildApiUrl } from "./server-api.js";
import { createAdminExchangeEnvelope } from "./admin-auth.js";

export async function exchangeAdminSession(
  profile,
  env = process.env,
  currentSessionToken = "",
) {
  const envelope = await createAdminExchangeEnvelope(profile, env);
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (currentSessionToken) {
    headers.Authorization = `Bearer ${currentSessionToken}`;
  }

  const response = await fetch(buildApiUrl("/api/admin/session/exchange", env), {
    method: "POST",
    headers,
    body: JSON.stringify(envelope),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || "admin_not_allowed");
  }

  return payload;
}

export async function fetchAdminSession(sessionToken, env = process.env) {
  if (!sessionToken) return null;

  const response = await fetch(buildApiUrl("/api/admin/session", env), {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  return payload?.authenticated ? payload.user : null;
}

export async function fetchAdminProfile(sessionToken, env = process.env) {
  if (!sessionToken) return null;

  const response = await fetch(buildApiUrl("/api/admin/profile", env), {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  return payload?.user || null;
}

export async function updateAdminProfile(sessionToken, input, env = process.env) {
  if (!sessionToken) {
    throw new Error("unauthorized");
  }

  const response = await fetch(buildApiUrl("/api/admin/profile", env), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || "profile_update_failed");
  }

  return payload?.user || null;
}

export async function fetchAdminUsers(sessionToken, env = process.env) {
  if (!sessionToken) return [];

  const response = await fetch(buildApiUrl("/api/admin/users", env), {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const payload = await response.json();
  return Array.isArray(payload?.users) ? payload.users : [];
}

export async function revokeAdminSession(sessionToken, env = process.env) {
  if (!sessionToken) return false;

  await fetch(buildApiUrl("/api/admin/logout", env), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  }).catch(() => null);

  return true;
}
