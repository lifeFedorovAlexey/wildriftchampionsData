import test from "node:test";
import assert from "node:assert/strict";
import {
  getContentSecurityPolicy,
  getSecurityHeaders,
} from "./security-headers.js";

test("security headers cover the production DAST requirements", () => {
  const headers = Object.fromEntries(
    getSecurityHeaders().map(({ key, value }) => [key.toLowerCase(), value]),
  );

  assert.equal(headers["x-frame-options"], "DENY");
  assert.equal(headers["x-content-type-options"], "nosniff");
  assert.equal(headers["strict-transport-security"], "max-age=31536000");
  assert.match(headers["permissions-policy"], /camera=\(\)/);
  assert.equal(headers["cross-origin-embedder-policy"], "credentialless");
  assert.equal(headers["cross-origin-opener-policy"], "same-origin");
  assert.equal(headers["cross-origin-resource-policy"], "same-origin");
});

test("nonce CSP keeps scripts and style blocks nonce-gated", () => {
  const policy = getContentSecurityPolicy("test-nonce");

  assert.match(policy, /'nonce-test-nonce'/);
  assert.match(policy, /style-src 'self' 'nonce-test-nonce'/);
  assert.match(policy, /style-src-attr 'unsafe-inline'/);
  assert.doesNotMatch(policy, /script-src[^;]*'unsafe-inline'/);
  assert.match(policy, /img-src[^;]*https:\/\/mc\.yandex\.com/);
  assert.match(policy, /img-src[^;]*https:\/\/t\.me/);
  assert.match(policy, /img-src[^;]*https:\/\/vkvideo\.ru/);
  assert.match(policy, /connect-src[^;]*https:\/\/mc\.yandex\.com/);
  assert.match(policy, /connect-src[^;]*wss:\/\/mc\.yandex\.ru/);
  assert.match(policy, /connect-src[^;]*wss:\/\/mc\.yandex\.com/);
  assert.match(policy, /frame-src[^;]*https:\/\/mc\.yandex\.ru/);
});

test("local development permits HMR and local S3 only with both development flags", () => {
  const env = { NODE_ENV: "development", WR_LOCAL_DEV: "true" };
  const policy = getContentSecurityPolicy("local-nonce", env);
  assert.match(policy, /script-src[^;]*'unsafe-eval'/);
  assert.match(policy, /ws:\/\/127\.0\.0\.1:3310/);
  assert.match(policy, /http:\/\/127\.0\.0\.1:3390/);
  assert.doesNotMatch(policy, /upgrade-insecure-requests/);
  assert.ok(!getSecurityHeaders(env).some(({ key }) => key === "Strict-Transport-Security"));
  const baseline = getContentSecurityPolicy("test", {});
  for (const env of [{ NODE_ENV: "production", WR_LOCAL_DEV: "true" }, { NODE_ENV: "development" }, {}]) {
    assert.equal(getContentSecurityPolicy("test", env), baseline);
    assert.ok(getSecurityHeaders(env).some(({ key }) => key === "Strict-Transport-Security"));
  }
});
