import { randomBytes, webcrypto } from "node:crypto";

const encoder = new TextEncoder();

export function normalizeSecret(env = process.env) {
  return String(env.ADMIN_SESSION_SECRET || "").trim();
}

export function normalizeNamedSecret(env = process.env, key = "ADMIN_SESSION_SECRET") {
  return String(env?.[key] || "").trim();
}

function normalizeOrigin(value) {
  return String(value || "").trim().replace(/\/$/, "");
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function getConfiguredOrigin(env = process.env) {
  return normalizeOrigin(
    env.ADMIN_PUBLIC_ORIGIN || env.NEXT_PUBLIC_SITE_URL || env.NEXT_PUBLIC_APP_URL,
  );
}

export function toBase64Url(value) {
  const base64 = Buffer.from(value).toString("base64");
  let normalized = base64.split("+").join("-").split("/").join("_");

  while (normalized.endsWith("=")) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

export function fromBase64Url(value) {
  const normalized = String(value).replace(/-/g, "+").replace(/_/g, "/");
  const padded =
    normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return Buffer.from(padded, "base64");
}

export function createCodeVerifier() {
  return toBase64Url(randomBytes(48));
}

function encodeUtf8(value) {
  return encoder.encode(String(value || ""));
}

async function digestSha256(value) {
  return await webcrypto.subtle.digest("SHA-256", encodeUtf8(value));
}

async function importHmacKey(secret) {
  return await webcrypto.subtle.importKey(
    "raw",
    encodeUtf8(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createCodeChallenge(codeVerifier) {
  const digest = await digestSha256(codeVerifier);
  return Buffer.from(digest).toString("base64url");
}

async function signEncodedValue(encoded, secret) {
  const key = await importHmacKey(secret);
  const signature = await webcrypto.subtle.sign("HMAC", key, encodeUtf8(encoded));
  return Buffer.from(signature).toString("base64url");
}

export async function signPayload(payload, secret) {
  const serialized = JSON.stringify(payload);
  const encoded = toBase64Url(serialized);
  const signature = await signEncodedValue(encoded, secret);
  return `${encoded}.${signature}`;
}

async function verifySignature(encoded, signature, secret) {
  const actual = fromBase64Url(String(signature || ""));
  if (!actual.length) {
    return false;
  }

  try {
    const key = await importHmacKey(secret);
    return await webcrypto.subtle.verify("HMAC", key, actual, encodeUtf8(encoded));
  } catch {
    return false;
  }
}

export async function readSignedPayload(token, secret) {
  if (!token || !secret) return null;

  const [encoded, signature] = String(token).split(".");
  if (!encoded || !signature) return null;
  if (!(await verifySignature(encoded, signature, secret))) return null;

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

export function buildOAuthProviders(
  origin,
  env = process.env,
  routeBase = "/api/admin/auth",
  options = {},
) {
  const secretKey = String(options.secretKey || "ADMIN_SESSION_SECRET").trim() || "ADMIN_SESSION_SECRET";
  const normalizedOrigin = normalizeOrigin(origin);
  const hasValidOrigin = isValidHttpUrl(normalizedOrigin);
  const googleClientId = String(env.ADMIN_GOOGLE_CLIENT_ID || "").trim();
  const googleClientSecret = String(env.ADMIN_GOOGLE_CLIENT_SECRET || "").trim();
  const yandexClientId = String(env.ADMIN_YANDEX_CLIENT_ID || "").trim();
  const yandexClientSecret = String(env.ADMIN_YANDEX_CLIENT_SECRET || "").trim();
  const vkClientId = String(env.ADMIN_VK_CLIENT_ID || "").trim();
  const vkClientSecret = String(env.ADMIN_VK_CLIENT_SECRET || "").trim();
  const vkAuthUrl = String(
    env.ADMIN_VK_AUTH_URL || "https://id.vk.com/authorize",
  ).trim();
  const vkTokenUrl = String(
    env.ADMIN_VK_TOKEN_URL || "https://id.vk.com/oauth2/auth",
  ).trim();
  const vkUserInfoUrl = String(env.ADMIN_VK_USERINFO_URL || "").trim();
  const vkScope = String(env.ADMIN_VK_SCOPE || "email").trim();
  const botUsername = String(env.ADMIN_TELEGRAM_BOT_USERNAME || "").trim();
  const botToken = String(env.ADMIN_TELEGRAM_BOT_TOKEN || "").trim();
  const secret = normalizeNamedSecret(env, secretKey);

  return {
    google: {
      id: "google",
      label: "Google",
      type: "oauth",
      enabled: Boolean(googleClientId && googleClientSecret && secret && hasValidOrigin),
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
      scope: "openid email profile",
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      redirectUri: `${normalizedOrigin}${routeBase}/google/callback`,
    },
    yandex: {
      id: "yandex",
      label: "Yandex",
      type: "oauth",
      enabled: Boolean(yandexClientId && yandexClientSecret && secret && hasValidOrigin),
      authUrl: "https://oauth.yandex.ru/authorize",
      tokenUrl: "https://oauth.yandex.ru/token",
      userInfoUrl: "https://login.yandex.ru/info?format=json",
      scope: "login:email login:info",
      clientId: yandexClientId,
      clientSecret: yandexClientSecret,
      redirectUri: `${normalizedOrigin}${routeBase}/yandex/callback`,
    },
    vk: {
      id: "vk",
      label: "VK",
      type: "oauth",
      enabled: Boolean(
        vkClientId &&
          vkClientSecret &&
          vkAuthUrl &&
          vkTokenUrl &&
          secret &&
          hasValidOrigin,
      ),
      authUrl: vkAuthUrl,
      tokenUrl: vkTokenUrl,
      userInfoUrl: vkUserInfoUrl,
      scope: vkScope,
      clientId: vkClientId,
      clientSecret: vkClientSecret,
      redirectUri: `${normalizedOrigin}${routeBase}/vk/callback`,
    },
    telegram: {
      id: "telegram",
      label: "Telegram",
      type: "telegram",
      enabled: Boolean(botUsername && botToken && secret && hasValidOrigin),
      botUsername,
      botToken,
      authUrl: `${normalizedOrigin}${routeBase}/telegram/callback`,
    },
  };
}

export async function buildAuthorizeUrl(provider, state) {
  if (!provider || !state) return "";

  const params = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: provider.redirectUri,
    response_type: "code",
    scope: provider.scope,
    state: state.nonce,
    code_challenge: await createCodeChallenge(state.codeVerifier),
    code_challenge_method: "S256",
  });

  if (provider.id === "google") {
    params.set("prompt", "select_account");
  }

  return `${provider.authUrl}?${params.toString()}`;
}

export async function exchangeOAuthCodeForTokens(
  provider,
  code,
  state,
  extraParams = {},
) {
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
    body.set("state", state.nonce);
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

export async function createSignedExchangeEnvelope(profile, env = process.env) {
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

  const signature = await signEncodedValue(payload, secret);
  return { payload, signature };
}

export async function createSignedExchangeEnvelopeWithSecret(
  profile,
  env = process.env,
  {
    secretKey = "ADMIN_SESSION_SECRET",
    missingSecretError = "missing_admin_session_secret",
  } = {},
) {
  const secret = normalizeNamedSecret(env, secretKey);
  if (!secret) {
    throw new Error(missingSecretError);
  }

  const payload = Buffer.from(
    JSON.stringify({
      profile,
      ts: Date.now(),
      nonce: randomBytes(16).toString("hex"),
    }),
  ).toString("base64url");

  const signature = await signEncodedValue(payload, secret);
  return { payload, signature };
}

export function getSessionTokenFromCookie(cookieStore, cookieName) {
  return cookieStore.get(cookieName)?.value || "";
}
