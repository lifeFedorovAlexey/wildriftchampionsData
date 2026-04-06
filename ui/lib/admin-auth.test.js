import test from "node:test";
import assert from "node:assert/strict";
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

test("createAdminExchangeEnvelope builds a signed payload for the api handoff", () => {
  const envelope = createAdminExchangeEnvelope(
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

test("issueAdminState preserves provider and safe return path", () => {
  const state = issueAdminState("google", "https://evil.test", env);
  const payload = readAdminState(state, env);

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

test("verifyTelegramLogin rejects stale auth payloads", () => {
  const params = new URLSearchParams({
    id: "42",
    first_name: "Life",
    username: "owner",
    auth_date: "1",
    hash: "deadbeef",
  });

  const verified = verifyTelegramLogin(params, env);
  assert.equal(verified.ok, false);
});
