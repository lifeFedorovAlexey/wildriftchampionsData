import { randomBytes } from "node:crypto";
import {
  ADMIN_STATE_TTL_SECONDS,
  buildAdminUrl,
  fetchOAuthProfile,
  getAdminCookieOptions,
  getAdminOrigin,
  mapOAuthProfile,
  verifyTelegramLogin,
} from "./admin-auth.js";
import {
  buildAuthorizeUrl,
  buildOAuthProviders,
  createCodeVerifier,
  createSignedExchangeEnvelope,
  exchangeOAuthCodeForTokens,
  getSessionTokenFromCookie,
  normalizeSecret,
  readSignedPayload,
  signPayload,
  toBase64Url,
} from "./oauth-common.js";

export const USER_SESSION_COOKIE = "wr_user_session";
export const USER_STATE_COOKIE = "wr_user_oauth_state";
export const USER_SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;
const PUBLIC_USER_AUTH_ENABLED = false;

export function sanitizeUserReturnTo(value) {
  const candidate = String(value || "").trim();
  return candidate.startsWith("/me") ? candidate : "/me";
}

export function getUserProviders(request, env = process.env) {
  if (!PUBLIC_USER_AUTH_ENABLED) {
    return {};
  }

  const origin = getAdminOrigin(request, env);
  const providers = buildOAuthProviders(origin, env, "/api/auth");
  const { telegram: _telegram, ...userProviders } = providers;
  return userProviders;
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

export async function issueUserState(providerId, returnTo, env = process.env) {
  const secret = normalizeSecret(env);
  if (!secret) return null;

  return await signPayload(
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

export async function readUserState(token, env = process.env) {
  const payload = await readSignedPayload(token, normalizeSecret(env));
  if (!payload || payload.kind !== "site-user-oauth-state") return null;
  return payload;
}

export async function createUserExchangeEnvelope(profile, env = process.env) {
  return await createSignedExchangeEnvelope(profile, env);
}

export function getUserSessionTokenFromCookie(cookieStore) {
  return getSessionTokenFromCookie(cookieStore, USER_SESSION_COOKIE);
}

export function getUserCookieOptions(request, maxAge) {
  return getAdminCookieOptions(request, maxAge);
}

export async function getUserAuthorizeUrl(provider, stateToken) {
  const state = await readUserState(stateToken);
  return await buildAuthorizeUrl(provider, state);
}

export function getUserRedirectUrl(request, path, env = process.env) {
  return buildAdminUrl(request, path, env);
}

export async function exchangeUserOAuthCode(provider, code, stateToken, extraParams = {}) {
  const state = await readUserState(stateToken);
  return await exchangeOAuthCodeForTokens(provider, code, state, extraParams);
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
    case "oauth_start_failed":
      return "Не удалось начать вход. Проверь настройки OAuth и попробуй ещё раз.";
    case "registration_disabled":
      return "Регистрация временно отключена.";
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
