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
  assert.match(policy, /img-src[^;]*https:\/\/vkvideo\.ru/);
  assert.match(policy, /connect-src[^;]*https:\/\/mc\.yandex\.com/);
  assert.match(policy, /connect-src[^;]*wss:\/\/mc\.yandex\.ru/);
  assert.match(policy, /connect-src[^;]*wss:\/\/mc\.yandex\.com/);
  assert.match(policy, /frame-src[^;]*https:\/\/mc\.yandex\.ru/);
});
