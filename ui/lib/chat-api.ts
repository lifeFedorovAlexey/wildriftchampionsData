import { buildApiUrl } from "./server-api.js";

export function getChatOrigin(env: NodeJS.ProcessEnv = process.env) {
  const keys = [
    "WR_CHAT_ORIGIN",
    "NEXT_PUBLIC_WR_CHAT_ORIGIN",
    "WR_CHAT_PUBLIC_ORIGIN",
    "NEXT_PUBLIC_WR_CHAT_PUBLIC_ORIGIN",
  ];

  for (const key of keys) {
    const value = env[key];
    if (value) {
      return String(value).replace(/\/+$/, "");
    }
  }

  return "http://127.0.0.1:3010";
}

export function buildChatWsUrl(origin: string, sessionToken: string) {
  const normalized = String(origin || "").trim().replace(/\/+$/, "");
  const wsBase = normalized.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
  const url = new URL(`${wsBase}/ws`);
  url.searchParams.set("sessionToken", sessionToken);
  return url.toString();
}

export async function fetchWrApiJson(
  pathname: string,
  sessionToken: string,
  init: RequestInit = {},
  env: NodeJS.ProcessEnv = process.env,
) {
  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (sessionToken) {
    headers.set("Authorization", `Bearer ${sessionToken}`);
  }

  const response = await fetch(buildApiUrl(pathname, env), {
    ...init,
    headers,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || `chat_api_http_${response.status}`);
  }

  return payload;
}

export async function exchangeChatSession(
  sessionToken: string,
  env: NodeJS.ProcessEnv = process.env,
) {
  const chatAuth = await fetchWrApiJson("/api/user/chat-auth", sessionToken, {}, env);
  const chatOrigin = getChatOrigin(env);

  const response = await fetch(`${chatOrigin}/session/exchange`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      payload: chatAuth?.chat?.payload || "",
      signature: chatAuth?.chat?.signature || "",
    }),
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || "chat_session_exchange_failed");
  }

  return {
    ...payload,
    origin: chatOrigin,
  };
}
