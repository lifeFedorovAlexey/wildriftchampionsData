import test from "node:test";
import assert from "node:assert/strict";

import {
  createUserExchangeEnvelope,
  getUserProviders,
  isPublicUserAuthEnabled,
  issueUserState,
  readUserState,
} from "./site-user-auth.js";

const enabledEnv = {
  USER_AUTH_ENABLED: "true",
  USER_SESSION_SECRET: "user-secret",
  ADMIN_GOOGLE_CLIENT_ID: "client-id",
  ADMIN_GOOGLE_CLIENT_SECRET: "client-secret",
  ADMIN_TELEGRAM_BOT_USERNAME: "bot",
  ADMIN_TELEGRAM_BOT_TOKEN: "123456:ABCDEF",
  ADMIN_PUBLIC_ORIGIN: "https://wildriftallstats.ru",
};

test("isPublicUserAuthEnabled reads explicit env flag", () => {
  assert.equal(isPublicUserAuthEnabled({ USER_AUTH_ENABLED: "true" }), true);
  assert.equal(isPublicUserAuthEnabled({ USER_AUTH_ENABLED: "false" }), false);
  assert.equal(isPublicUserAuthEnabled({}), false);
});

test("getUserProviders stays disabled until USER_AUTH_ENABLED is true", () => {
  const providers = getUserProviders(
    { url: "https://wildriftallstats.ru/me", headers: new Headers() },
    {
      ...enabledEnv,
      USER_AUTH_ENABLED: "false",
    },
  );

  assert.deepEqual(providers, {});
});

test("getUserProviders uses USER_SESSION_SECRET boundary and keeps telegram available", () => {
  const providers = getUserProviders(
    { url: "https://wildriftallstats.ru/me", headers: new Headers() },
    enabledEnv,
  );

  assert.equal(providers.google.enabled, true);
  assert.equal(providers.telegram.enabled, true);
  assert.equal(
    providers.google.redirectUri,
    "https://wildriftallstats.ru/api/auth/google/callback",
  );
});

test("issueUserState and readUserState use USER_SESSION_SECRET", async () => {
  const state = await issueUserState("google", "/me", enabledEnv);
  const payload = await readUserState(state, enabledEnv);

  assert.equal(payload?.provider, "google");
  assert.equal(payload?.returnTo, "/me");
});

test("createUserExchangeEnvelope requires USER_SESSION_SECRET", async () => {
  await assert.rejects(
    () =>
      createUserExchangeEnvelope(
        {
          provider: "vk",
          subject: "123",
          email: "",
          name: "User",
          username: "user",
          avatarUrl: "",
        },
        { USER_AUTH_ENABLED: "true" },
      ),
    /missing_user_session_secret/,
  );
});
