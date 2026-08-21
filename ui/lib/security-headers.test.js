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

test("nonce CSP does not allow unsafe inline scripts or styles", () => {
  const policy = getContentSecurityPolicy("test-nonce");

  assert.match(policy, /'nonce-test-nonce'/);
  assert.doesNotMatch(policy, /'unsafe-inline'/);
});
