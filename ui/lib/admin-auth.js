import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "wr_admin_session";
export const ADMIN_STATE_COOKIE = "wr_admin_oauth_state";
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;
export const ADMIN_STATE_TTL_SECONDS = 60 * 10;

const DEFAULT_LOGIN_PATH = "/admin/login";
const DEFAULT_ADMIN_PATH = "/admin";

function toBase64Url(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value) {
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const padded =
    normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, "base64");
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

export function sanitizeAdminReturnTo(value) {
  const candidate = String(value || "").trim();
  return candidate.startsWith("/admin") ? candidate : DEFAULT_ADMIN_PATH;
}

export function getAdminOrigin(request, env = process.env) {
  const configuredOrigin = String(
    env.NEXT_PUBLIC_SITE_URL || env.NEXT_PUBLIC_APP_URL || "",
  ).trim();

  if (configuredOrigin) {
    return configuredOrigin.replace(/\/$/, "");
  }

  const requestUrl = request?.url ? new URL(request.url) : null;
  if (requestUrl) {
    return requestUrl.origin;
  }

  return "";
}

function createCodeVerifier() {
  return toBase64Url(randomBytes(48));
}

function createCodeChallenge(codeVerifier) {
  return createHash("sha256").update(codeVerifier).digest("base64url");
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
    redirectUri: `${origin}/api/admin/auth/google/callback`,
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
    redirectUri: `${origin}/api/admin/auth/yandex/callback`,
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
    enabled: Boolean(
      clientId && clientSecret && authUrl && tokenUrl && normalizeSecret(env),
    ),
    authUrl,
    tokenUrl,
    userInfoUrl,
    scope,
    clientId,
    clientSecret,
    redirectUri: `${origin}/api/admin/auth/vk/callback`,
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
    authUrl: `${origin}/api/admin/auth/telegram/callback`,
  };
}

export function getAdminProviders(request, env = process.env) {
  const origin = getAdminOrigin(request, env);

  return {
    google: buildGoogleProvider(origin, env),
    yandex: buildYandexProvider(origin, env),
    vk: buildVkProvider(origin, env),
    telegram: buildTelegramProvider(origin, env),
  };
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

export function issueAdminState(providerId, returnTo, env = process.env) {
  const secret = normalizeSecret(env);
  if (!secret) return null;

  const codeVerifier = createCodeVerifier();

  return signPayload(
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

export function readAdminState(token, env = process.env) {
  const payload = readSignedPayload(token, normalizeSecret(env));
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

export function buildAdminAuthorizeUrl(provider, stateToken) {
  const state = readAdminState(stateToken);
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

export async function exchangeOAuthCode(provider, code, stateToken) {
  const state = readAdminState(stateToken);
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

export function verifyTelegramLogin(searchParams, env = process.env) {
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

  const secretKey = createHash("sha256").update(botToken).digest();
  const expectedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

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

export function createAdminExchangeEnvelope(profile, env = process.env) {
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

export function getAdminSessionTokenFromCookie(cookieStore) {
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value || "";
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
