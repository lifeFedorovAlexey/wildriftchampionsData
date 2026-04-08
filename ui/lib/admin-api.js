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

export async function exchangeAdminTelegramWebAppSession(
  initData,
  env = process.env,
  currentSessionToken = "",
) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (currentSessionToken) {
    headers.Authorization = `Bearer ${currentSessionToken}`;
  }

  const response = await fetch(
    buildApiUrl("/api/admin/session/telegram-webapp", env),
    {
      method: "POST",
      headers,
      body: JSON.stringify({ initData }),
      cache: "no-store",
    },
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || "telegram_bad_hash");
  }

  return payload;
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

export async function fetchAdminGuidesAudit(sessionToken, env = process.env, runId = "") {
  if (!sessionToken) return null;

  const pathname = runId
    ? `/api/admin/guides-audit?runId=${encodeURIComponent(runId)}`
    : "/api/admin/guides-audit";
  const response = await fetch(buildApiUrl(pathname, env), {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return await response.json();
}

export async function startAdminGuidesAudit(sessionToken, input = {}, env = process.env) {
  if (!sessionToken) {
    throw new Error("unauthorized");
  }

  const response = await fetch(buildApiUrl("/api/admin/guides-audit", env), {
    method: "POST",
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
    throw new Error(payload?.error || "guides_audit_start_failed");
  }

  return payload;
}

export async function clearAdminGuidesAudit(sessionToken, env = process.env) {
  if (!sessionToken) {
    throw new Error("unauthorized");
  }

  const response = await fetch(buildApiUrl("/api/admin/guides-audit", env), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || "guides_audit_clear_failed");
  }

  return payload;
}
