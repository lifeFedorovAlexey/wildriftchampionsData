import test from "node:test";
import assert from "node:assert/strict";
import { buildOAuthProviders } from "./oauth-common.js";
import {
  ADMIN_SESSION_COOKIE,
  createAdminExchangeEnvelope,
  getAdminSessionTokenFromCookie,
  issueAdminState,
  readAdminState,
  sanitizeAdminReturnTo,
  verifyTelegramLogin,
} from "./admin-auth.js";

const env = {
  ADMIN_SESSION_SECRET: "super-secret",
  ADMIN_TELEGRAM_BOT_TOKEN: "123456:ABCDEF",
};

test("createAdminExchangeEnvelope builds a signed payload for the api handoff", async () => {
  const envelope = await createAdminExchangeEnvelope(
    {
      provider: "google",
      subject: "abc",
      email: "boss@example.com",
      name: "Boss",
      username: "",
      avatarUrl: "",
    },
    env,
  );

  assert.equal(typeof envelope.payload, "string");
  assert.equal(typeof envelope.signature, "string");
  assert.ok(envelope.payload.length > 10);
  assert.ok(envelope.signature.length > 10);
});

test("issueAdminState preserves provider and safe return path", async () => {
  const state = await issueAdminState("google", "https://evil.test", env);
  const payload = await readAdminState(state, env);

  assert.equal(payload?.provider, "google");
  assert.equal(payload?.returnTo, "/admin");
  assert.ok(payload?.codeVerifier);
});

test("sanitizeAdminReturnTo only keeps admin-local paths", () => {
  assert.equal(sanitizeAdminReturnTo("/admin/tools"), "/admin/tools");
  assert.equal(sanitizeAdminReturnTo("/guides"), "/admin");
});

test("getAdminSessionTokenFromCookie reads the raw cookie value", () => {
  const cookieStore = {
    get(name) {
      if (name !== ADMIN_SESSION_COOKIE) return undefined;
      return { value: "session-token" };
    },
  };

  const sessionToken = getAdminSessionTokenFromCookie(cookieStore);
  assert.equal(sessionToken, "session-token");
});

test("verifyTelegramLogin rejects stale auth payloads", async () => {
  const params = new URLSearchParams({
    id: "42",
    first_name: "Life",
    username: "owner",
    auth_date: "1",
    hash: "deadbeef",
  });

  const verified = await verifyTelegramLogin(params, env);
  assert.equal(verified.ok, false);
});

test("buildOAuthProviders disables oauth providers without a valid public origin", () => {
  const providers = buildOAuthProviders("", {
    ADMIN_SESSION_SECRET: "super-secret",
    ADMIN_GOOGLE_CLIENT_ID: "client-id",
    ADMIN_GOOGLE_CLIENT_SECRET: "client-secret",
    ADMIN_TELEGRAM_BOT_USERNAME: "bot",
    ADMIN_TELEGRAM_BOT_TOKEN: "123456:ABCDEF",
  });

  assert.equal(providers.google.enabled, false);
  assert.equal(providers.telegram.enabled, false);
});

test("buildOAuthProviders keeps oauth providers enabled with a valid public origin", () => {
  const providers = buildOAuthProviders("https://wildriftallstats.ru", {
    ADMIN_SESSION_SECRET: "super-secret",
    ADMIN_GOOGLE_CLIENT_ID: "client-id",
    ADMIN_GOOGLE_CLIENT_SECRET: "client-secret",
  }, "/api/auth");

  assert.equal(providers.google.enabled, true);
  assert.equal(
    providers.google.redirectUri,
    "https://wildriftallstats.ru/api/auth/google/callback",
  );
});
