import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import {
  ADMIN_STATE_TTL_SECONDS,
  buildAdminUrl,
  fetchOAuthProfile,
  getAdminCookieOptions,
  getAdminOrigin,
  mapOAuthProfile,
  verifyTelegramLogin,
} from "./admin-auth.js";

export const USER_SESSION_COOKIE = "wr_user_session";
export const USER_STATE_COOKIE = "wr_user_oauth_state";
export const USER_SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

function toBase64Url(value) {
  const base64 = Buffer.from(value).toString("base64");
  let normalized = base64.split("+").join("-").split("/").join("_");

  while (normalized.endsWith("=")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

function fromBase64Url(value) {
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const padded =
    normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, "base64");
}

function createCodeVerifier() {
  return toBase64Url(randomBytes(48));
}

function createCodeChallenge(codeVerifier) {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}

function normalizeSecret(env = process.env) {
  return String(env.ADMIN_SESSION_SECRET || "").trim();
}

function signPayload(payload, secret) {
  const serialized = JSON.stringify(payload);
  const encoded = toBase64Url(serialized);
  const signature = createHmac("sha256", secret).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function verifySignature(encoded, signature, secret) {
  const expected = createHmac("sha256", secret).update(encoded).digest();
  const actual = Buffer.from(String(signature || ""), "base64url");

  if (!actual.length || actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}

function readSignedPayload(token, secret) {
  if (!token || !secret) return null;

  const [encoded, signature] = String(token).split(".");
  if (!encoded || !signature) return null;
  if (!verifySignature(encoded, signature, secret)) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encoded).toString("utf8"));
    if (typeof payload?.exp !== "number" || payload.exp <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function buildGoogleProvider(origin, env = process.env) {
  const clientId = String(env.ADMIN_GOOGLE_CLIENT_ID || "").trim();
  const clientSecret = String(env.ADMIN_GOOGLE_CLIENT_SECRET || "").trim();

  return {
    id: "google",
    label: "Google",
    type: "oauth",
    enabled: Boolean(clientId && clientSecret && normalizeSecret(env)),
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email profile",
    clientId,
    clientSecret,
    redirectUri: `${origin}/api/auth/google/callback`,
  };
}

function buildYandexProvider(origin, env = process.env) {
  const clientId = String(env.ADMIN_YANDEX_CLIENT_ID || "").trim();
  const clientSecret = String(env.ADMIN_YANDEX_CLIENT_SECRET || "").trim();

  return {
    id: "yandex",
    label: "Yandex",
    type: "oauth",
    enabled: Boolean(clientId && clientSecret && normalizeSecret(env)),
    authUrl: "https://oauth.yandex.ru/authorize",
    tokenUrl: "https://oauth.yandex.ru/token",
    userInfoUrl: "https://login.yandex.ru/info?format=json",
    scope: "login:email login:info",
    clientId,
    clientSecret,
    redirectUri: `${origin}/api/auth/yandex/callback`,
  };
}

function buildVkProvider(origin, env = process.env) {
  const clientId = String(env.ADMIN_VK_CLIENT_ID || "").trim();
  const clientSecret = String(env.ADMIN_VK_CLIENT_SECRET || "").trim();
  const authUrl = String(
    env.ADMIN_VK_AUTH_URL || "https://id.vk.com/authorize",
  ).trim();
  const tokenUrl = String(env.ADMIN_VK_TOKEN_URL || "https://id.vk.com/oauth2/auth").trim();
  const userInfoUrl = String(env.ADMIN_VK_USERINFO_URL || "").trim();
  const scope = String(env.ADMIN_VK_SCOPE || "email").trim();

  return {
    id: "vk",
    label: "VK",
    type: "oauth",
    enabled: Boolean(clientId && clientSecret && authUrl && tokenUrl && normalizeSecret(env)),
    authUrl,
    tokenUrl,
    userInfoUrl,
    scope,
    clientId,
    clientSecret,
    redirectUri: `${origin}/api/auth/vk/callback`,
  };
}

function buildTelegramProvider(origin, env = process.env) {
  const botUsername = String(env.ADMIN_TELEGRAM_BOT_USERNAME || "").trim();
  const botToken = String(env.ADMIN_TELEGRAM_BOT_TOKEN || "").trim();

  return {
    id: "telegram",
    label: "Telegram",
    type: "telegram",
    enabled: Boolean(botUsername && botToken && normalizeSecret(env)),
    botUsername,
    botToken,
    authUrl: `${origin}/api/auth/telegram/callback`,
  };
}

export function sanitizeUserReturnTo(value) {
  const candidate = String(value || "").trim();
  return candidate.startsWith("/me") ? candidate : "/me";
}

export function getUserProviders(request, env = process.env) {
  const origin = getAdminOrigin(request, env);

  return {
    google: buildGoogleProvider(origin, env),
    yandex: buildYandexProvider(origin, env),
    vk: buildVkProvider(origin, env),
    telegram: buildTelegramProvider(origin, env),
  };
}

export function getUserProviderCards(request, env = process.env) {
  const providers = getUserProviders(request, env);
  return Object.values(providers).map((provider) => ({
    id: provider.id,
    label: provider.label,
    type: provider.type,
    enabled: provider.enabled,
    startHref:
      provider.type === "oauth"
        ? `/api/auth/${provider.id}/start`
        : provider.authUrl,
  }));
}

export function getUserProvider(request, providerId, env = process.env) {
  return getUserProviders(request, env)[providerId] || null;
}

export function issueUserState(providerId, returnTo, env = process.env) {
  const secret = normalizeSecret(env);
  if (!secret) return null;

  return signPayload(
    {
      kind: "site-user-oauth-state",
      provider: providerId,
      returnTo: sanitizeUserReturnTo(returnTo),
      codeVerifier: createCodeVerifier(),
      nonce: toBase64Url(randomBytes(24)),
      exp: Date.now() + ADMIN_STATE_TTL_SECONDS * 1000,
    },
    secret,
  );
}

export function readUserState(token, env = process.env) {
  const payload = readSignedPayload(token, normalizeSecret(env));
  if (!payload || payload.kind !== "site-user-oauth-state") return null;
  return payload;
}

export function createUserExchangeEnvelope(profile, env = process.env) {
  const secret = normalizeSecret(env);
  if (!secret) {
    throw new Error("missing_admin_session_secret");
  }

  const payload = Buffer.from(
    JSON.stringify({
      profile,
      ts: Date.now(),
      nonce: randomBytes(16).toString("hex"),
    }),
  ).toString("base64url");

  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return { payload, signature };
}

export function getUserSessionTokenFromCookie(cookieStore) {
  return cookieStore.get(USER_SESSION_COOKIE)?.value || "";
}

export function getUserCookieOptions(request, maxAge) {
  return getAdminCookieOptions(request, maxAge);
}

export function getUserAuthorizeUrl(provider, stateToken) {
  const state = readUserState(stateToken);
  if (!provider || !state) return "";

  const params = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: provider.redirectUri,
    response_type: "code",
    scope: provider.scope,
    state: stateToken,
    code_challenge: createCodeChallenge(state.codeVerifier),
    code_challenge_method: "S256",
  });

  if (provider.id === "google") {
    params.set("prompt", "select_account");
  }

  return `${provider.authUrl}?${params.toString()}`;
}

export function getUserRedirectUrl(request, path, env = process.env) {
  return buildAdminUrl(request, path, env);
}

export async function exchangeUserOAuthCode(provider, code, stateToken, extraParams = {}) {
  const state = readUserState(stateToken);
  if (!provider || !state?.codeVerifier || !code) {
    throw new Error("invalid_oauth_state");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: provider.clientId,
    client_secret: provider.clientSecret,
    redirect_uri: provider.redirectUri,
    code,
    code_verifier: state.codeVerifier,
  });

  if (provider.id === "vk") {
    const deviceId = String(extraParams.deviceId || "").trim();
    if (!deviceId) {
      throw new Error("oauth_access_denied");
    }

    body.set("device_id", deviceId);
    body.set("state", stateToken);
  }

  const response = await fetch(provider.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`oauth_token_${response.status}`);
  }

  return await response.json();
}

export { fetchOAuthProfile, mapOAuthProfile, verifyTelegramLogin };

export function getUserErrorMessage(code) {
  const normalized = String(code || "").trim();

  switch (normalized) {
    case "provider_not_available":
      return "Этот способ входа пока не настроен.";
    case "oauth_access_denied":
      return "Вход был отменён на стороне провайдера.";
    case "oauth_state_invalid":
      return "Сессия входа устарела. Попробуй ещё раз.";
    case "telegram_bad_hash":
      return "Telegram не подтвердил подпись входа.";
    case "profile_update_failed":
      return "Не удалось обновить профиль.";
    default:
      return normalized ? "Не удалось выполнить вход." : "";
  }
}

export function buildUserLoginRedirect(errorCode = "") {
  const params = new URLSearchParams();
  if (errorCode) params.set("error", errorCode);
  const query = params.toString();
  return query ? `/me?${query}` : "/me";
}
