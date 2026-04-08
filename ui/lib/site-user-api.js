import { buildApiUrl } from "./server-api.js";
import { createUserExchangeEnvelope } from "./site-user-auth.js";

export async function exchangeSiteUserSession(
  profile,
  env = process.env,
  currentSessionToken = "",
) {
  const envelope = await createUserExchangeEnvelope(profile, env);
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (currentSessionToken) {
    headers.Authorization = `Bearer ${currentSessionToken}`;
  }

  const response = await fetch(buildApiUrl("/api/user/session/exchange", env), {
    method: "POST",
    headers,
    body: JSON.stringify(envelope),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || "user_auth_failed");
  }

  return payload;
}

export async function fetchSiteUserSession(sessionToken, env = process.env) {
  if (!sessionToken) return null;

  const response = await fetch(buildApiUrl("/api/user/session", env), {
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

export async function exchangeSiteUserTelegramWebAppSession(
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
    buildApiUrl("/api/user/session/telegram-webapp", env),
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

export async function updateSiteUserProfile(sessionToken, input, env = process.env) {
  if (!sessionToken) {
    throw new Error("unauthorized");
  }

  const response = await fetch(buildApiUrl("/api/user/profile", env), {
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

export async function revokeSiteUserSession(sessionToken, env = process.env) {
  if (!sessionToken) return false;

  await fetch(buildApiUrl("/api/user/logout", env), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  }).catch(() => null);

  return true;
}
