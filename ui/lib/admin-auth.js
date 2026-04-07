import { randomBytes, webcrypto } from "node:crypto";
import {
  buildAuthorizeUrl,
  buildOAuthProviders,
  createCodeVerifier,
  createSignedExchangeEnvelope,
  exchangeOAuthCodeForTokens,
  getConfiguredOrigin,
  getSessionTokenFromCookie,
  normalizeSecret,
  readSignedPayload,
  signPayload,
  toBase64Url,
} from "./oauth-common.js";

export const ADMIN_SESSION_COOKIE = "wr_admin_session";
export const ADMIN_STATE_COOKIE = "wr_admin_oauth_state";
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;
export const ADMIN_STATE_TTL_SECONDS = 60 * 10;

const DEFAULT_LOGIN_PATH = "/admin/login";
const DEFAULT_ADMIN_PATH = "/admin";

export function sanitizeAdminReturnTo(value) {
  const candidate = String(value || "").trim();
  return candidate.startsWith("/admin") ? candidate : DEFAULT_ADMIN_PATH;
}

export function getAdminOrigin(request, env = process.env) {
  const explicitOrigin = getConfiguredOrigin(env);
  if (explicitOrigin) {
    return explicitOrigin;
  }

  const forwardedProto = String(
    request?.headers?.get?.("x-forwarded-proto") || "",
  )
    .split(",")[0]
    .trim();
  const forwardedHost = String(
    request?.headers?.get?.("x-forwarded-host") ||
      request?.headers?.get?.("host") ||
      "",
  ).trim();
  const isLocalHost = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(forwardedHost);

  if (forwardedHost) {
    const protocol = forwardedProto || (isLocalHost ? "http" : "https");
    return `${protocol}://${forwardedHost}`.replace(/\/$/, "");
  }

  const requestUrl = request?.url ? new URL(request.url) : null;
  if (requestUrl?.origin && !/^(https?:\/\/)?localhost(?::\d+)?$/i.test(requestUrl.origin)) {
    const protocol =
      requestUrl.protocol === "http:" &&
      !/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(requestUrl.host)
        ? "https:"
        : requestUrl.protocol;
    return `${protocol}//${requestUrl.host}`;
  }

  return "";
}

export function buildAdminUrl(request, path, env = process.env) {
  const origin = getAdminOrigin(request, env) || new URL(request.url).origin;
  return new URL(path, `${origin}/`);
}

export function getAdminProviders(request, env = process.env) {
  const origin = getAdminOrigin(request, env);
  return buildOAuthProviders(origin, env, "/api/admin/auth");
}

export function getAdminProvider(request, providerId, env = process.env) {
  return getAdminProviders(request, env)[providerId] || null;
}

export function getAdminProviderCards(request, env = process.env) {
  const providers = getAdminProviders(request, env);
  return Object.values(providers).map((provider) => ({
    id: provider.id,
    label: provider.label,
    type: provider.type,
    enabled: provider.enabled,
    startHref:
      provider.type === "oauth"
        ? `/api/admin/auth/${provider.id}/start`
        : provider.authUrl,
  }));
}

const encoder = new TextEncoder();

export async function issueAdminState(providerId, returnTo, env = process.env) {
  const secret = normalizeSecret(env);
  if (!secret) return null;

  const codeVerifier = createCodeVerifier();

  return await signPayload(
    {
      kind: "admin-oauth-state",
      provider: providerId,
      returnTo: sanitizeAdminReturnTo(returnTo),
      codeVerifier,
      nonce: toBase64Url(randomBytes(24)),
      exp: Date.now() + ADMIN_STATE_TTL_SECONDS * 1000,
    },
    secret,
  );
}

export async function readAdminState(token, env = process.env) {
  const payload = await readSignedPayload(token, normalizeSecret(env));
  if (!payload || payload.kind !== "admin-oauth-state") return null;
  return payload;
}

/**
 * @param {{ url?: string, headers?: { get?: (name: string) => string | null } } | undefined} request
 * @param {number} maxAge
 * @returns {{ httpOnly: true, sameSite: "lax", secure: boolean, path: "/", maxAge: number }}
 */
export function getAdminCookieOptions(request, maxAge) {
  const requestUrl = request?.url ? new URL(request.url) : null;
  const isHttps =
    requestUrl?.protocol === "https:" ||
    request?.headers?.get?.("x-forwarded-proto") === "https";

  return {
    httpOnly: true,
    sameSite: "lax",
    secure: Boolean(isHttps),
    path: "/",
    maxAge,
  };
}

export async function buildAdminAuthorizeUrl(provider, stateToken) {
  const state = await readAdminState(stateToken);
  return await buildAuthorizeUrl(provider, state);
}

export async function exchangeOAuthCode(
  provider,
  code,
  stateToken,
  extraParams = {},
) {
  const state = await readAdminState(stateToken);
  return await exchangeOAuthCodeForTokens(provider, code, state, extraParams);
}

export async function fetchOAuthProfile(provider, accessToken, tokenPayload = {}) {
  if (provider.id === "vk" && !provider.userInfoUrl) {
    return tokenPayload;
  }

  const response = await fetch(provider.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`oauth_profile_${response.status}`);
  }

  return await response.json();
}

export function mapOAuthProfile(providerId, profile, tokenPayload = {}) {
  if (providerId === "google") {
    return {
      provider: "google",
      subject: String(profile.sub || ""),
      email: String(profile.email || ""),
      name: String(profile.name || ""),
      username: "",
      avatarUrl: String(profile.picture || ""),
    };
  }

  if (providerId === "yandex") {
    return {
      provider: "yandex",
      subject: String(profile.id || ""),
      email: String(profile.default_email || ""),
      name: String(profile.real_name || profile.display_name || ""),
      username: String(profile.login || ""),
      avatarUrl: "",
    };
  }

  if (providerId === "vk") {
    const user =
      profile?.user ||
      profile?.response?.[0] ||
      profile?.response ||
      profile?.result?.user ||
      profile?.result ||
      profile;

    const firstName = String(user?.first_name || "");
    const lastName = String(user?.last_name || "");
    const fullName = `${firstName} ${lastName}`.trim();

    return {
      provider: "vk",
      subject: String(
        tokenPayload?.user_id || user?.user_id || user?.id || user?.sub || "",
      ),
      email: String(user?.email || profile?.email || tokenPayload?.email || ""),
      name: String(user?.name || fullName || ""),
      username: String(user?.screen_name || user?.domain || ""),
      avatarUrl: String(
        user?.avatar ||
          user?.avatar_url ||
          user?.photo_200 ||
          user?.picture ||
          "",
      ),
    };
  }

  return null;
}

export async function verifyTelegramLogin(searchParams, env = process.env) {
  const botToken = String(env.ADMIN_TELEGRAM_BOT_TOKEN || "").trim();
  if (!botToken) {
    return { ok: false, reason: "telegram_not_configured" };
  }

  const pairs = [];
  let hash = "";

  for (const [key, value] of searchParams.entries()) {
    if (key === "hash") {
      hash = value;
      continue;
    }

    pairs.push([key, value]);
  }

  if (!hash) {
    return { ok: false, reason: "telegram_missing_hash" };
  }

  const authDate = Number(searchParams.get("auth_date") || 0);
  if (!authDate || Date.now() - authDate * 1000 > ADMIN_STATE_TTL_SECONDS * 1000) {
    return { ok: false, reason: "telegram_expired" };
  }

  const dataCheckString = pairs
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = await webcrypto.subtle.digest(
    "SHA-256",
    encoder.encode(botToken),
  );
  const hmacKey = await webcrypto.subtle.importKey(
    "raw",
    secretKey,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await webcrypto.subtle.sign(
    "HMAC",
    hmacKey,
    encoder.encode(dataCheckString),
  );
  const expectedHash = Buffer.from(signature).toString("hex");

  if (expectedHash !== hash) {
    return { ok: false, reason: "telegram_bad_hash" };
  }

  return {
    ok: true,
    profile: {
      provider: "telegram",
      subject: String(searchParams.get("id") || ""),
      email: "",
      name: [searchParams.get("first_name"), searchParams.get("last_name")]
        .filter(Boolean)
        .join(" "),
      username: String(searchParams.get("username") || ""),
      avatarUrl: String(searchParams.get("photo_url") || ""),
    },
  };
}

export async function createAdminExchangeEnvelope(profile, env = process.env) {
  return await createSignedExchangeEnvelope(profile, env);
}

export function getAdminSessionTokenFromCookie(cookieStore) {
  return getSessionTokenFromCookie(cookieStore, ADMIN_SESSION_COOKIE);
}

export function getAdminErrorMessage(code) {
  const normalized = String(code || "").trim();

  switch (normalized) {
    case "provider_not_available":
      return "Этот способ входа пока не настроен.";
    case "oauth_access_denied":
      return "Вход был отменён на стороне провайдера.";
    case "oauth_state_invalid":
      return "Сессия входа устарела. Попробуй ещё раз.";
    case "admin_not_allowed":
      return "Для этого аккаунта ещё не выдана роль в БД.";
    case "session_secret_missing":
      return "Для админки не задан ADMIN_SESSION_SECRET.";
    case "oauth_start_failed":
      return "Не удалось начать вход. Проверь настройки OAuth и попробуй ещё раз.";
    case "telegram_bad_hash":
      return "Telegram не подтвердил подпись входа.";
    case "bootstrap_required":
      return "Сначала зайди аккаунтом, который указан для первого owner-bootstrap.";
    default:
      return normalized ? "Не удалось выполнить вход." : "";
  }
}

export function getAdminEnvHints() {
  return [
    "ADMIN_PUBLIC_ORIGIN for production admin OAuth origin",
    "ADMIN_SESSION_SECRET",
    "ADMIN_BOOTSTRAP_EMAILS или ADMIN_BOOTSTRAP_TELEGRAM_IDS только для первого owner",
    "ADMIN_TELEGRAM_BOT_USERNAME + ADMIN_TELEGRAM_BOT_TOKEN",
    "ADMIN_GOOGLE_CLIENT_ID + ADMIN_GOOGLE_CLIENT_SECRET",
    "ADMIN_YANDEX_CLIENT_ID + ADMIN_YANDEX_CLIENT_SECRET",
    "ADMIN_VK_CLIENT_ID + ADMIN_VK_CLIENT_SECRET + ADMIN_VK_TOKEN_URL + ADMIN_VK_USERINFO_URL",
  ];
}

export function buildLoginRedirect(errorCode = "") {
  const params = new URLSearchParams();
  if (errorCode) params.set("error", errorCode);
  const query = params.toString();
  return query ? `${DEFAULT_LOGIN_PATH}?${query}` : DEFAULT_LOGIN_PATH;
}
