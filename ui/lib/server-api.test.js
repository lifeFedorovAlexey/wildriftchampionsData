import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { once } from "node:events";

import { buildApiUrl, fetchApiJson } from "./server-api.js";
import { exchangeSiteUserSession, fetchSiteUserSession, exchangeSiteUserTelegramWebAppSession, updateSiteUserProfile, revokeSiteUserSession } from "./site-user-api.js";
import { exchangeAdminSession } from "./admin-api.js";
import { proxyBackendApi } from "./backend-api-proxy.js";
import { readPublicApi } from "./public-data-store.js";

test("buildApiUrl uses stats api origin and trims trailing slash", () => {
  const url = buildApiUrl("/api/news", {
    STATS_API_ORIGIN: "https://stats.example.com/",
  });

  assert.equal(url, "https://stats.example.com/api/news");
});

test("snapshot mode routes all private API families to the backend", () => {
  const env = { PUBLIC_DATA_MODE: "snapshot", PUBLIC_DATA_ORIGIN: "http://127.0.0.1:3000/public-data", API_PROXY_TARGET: "http://127.0.0.1:3001" };
  for (const path of ["/api/user/session/exchange", "/api/user/session", "/api/user/profile", "/api/admin/session/exchange", "/api/quizzes", "/api/user/chat/messages", "/api/public-tierlists?editor=1", "/api/workflow-options", "/api/webapp-open"]) {
    assert.equal(buildApiUrl(path, env), `http://127.0.0.1:3001${path}`);
  }
  for (const path of ["/api/champions?lang=en_us", "/api/updated-at", "/api/guides/ahri", "/api/patch-notes/7.3f", "/api/trend-events?slug=ahri"]) {
    assert.equal(buildApiUrl(path, env), `http://127.0.0.1:3000/public-data${path}`);
  }
});

test("login, session and profile use real backend HTTP while public reads survive its outage", async () => {
  const calls = [];
  const backend = http.createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    calls.push({ path: req.url, method: req.method, authorization: req.headers.authorization, body: body ? JSON.parse(body) : null });
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(req.url === "/api/user/session"
      ? { authenticated: true, user: { id: 42 } }
      : { ok: true, sessionToken: "test-session", user: { id: 42 } }));
  });
  const snapshots = http.createServer((req, res) => {
    assert.equal(req.method, "GET");
    assert.equal(req.url, "/public-data/api/updated-at");
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ statsDate: "2026-11-24" }));
  });
  backend.listen(0, "127.0.0.1");
  snapshots.listen(0, "127.0.0.1");
  await Promise.all([once(backend, "listening"), once(snapshots, "listening")]);
  const env = { PUBLIC_DATA_MODE: "snapshot", PUBLIC_DATA_ORIGIN: `http://127.0.0.1:${snapshots.address().port}/public-data`, API_PROXY_TARGET: `http://127.0.0.1:${backend.address().port}`, USER_SESSION_SECRET: "test-user-secret", ADMIN_SESSION_SECRET: "test-admin-secret" };
  try {
    for (const provider of ["google", "yandex", "vk", "telegram"]) {
      const result = await exchangeSiteUserSession({ provider, subject: "test-subject", displayName: "Test" }, env);
      assert.equal(result.sessionToken, "test-session");
    }
    await exchangeAdminSession({ provider: "google", subject: "test-admin" }, env);
    await exchangeSiteUserTelegramWebAppSession("test-init-data", env);
    assert.deepEqual(await fetchSiteUserSession("test-session", env), { id: 42 });
    await updateSiteUserProfile("test-session", { displayName: "Changed" }, env);
    await revokeSiteUserSession("test-session", env);
    assert.equal(calls.filter(call => call.path === "/api/user/session/exchange").length, 4);
    assert.ok(calls.slice(0, 4).every(call => call.method === "POST" && call.body.payload && call.body.signature));
    assert.equal(calls.find(call => call.path === "/api/user/session").authorization, "Bearer test-session");
    assert.equal(calls.find(call => call.path === "/api/user/profile").method, "PATCH");
    await new Promise(resolve => backend.close(resolve));
    assert.deepEqual(await fetchApiJson("/api/updated-at", { env }), { statsDate: "2026-11-24" });
    await assert.rejects(exchangeSiteUserSession({ provider: "google", subject: "test-subject" }, env));
  } finally {
    backend.closeAllConnections();
    snapshots.closeAllConnections();
    await Promise.all([new Promise(resolve => backend.close(resolve)), new Promise(resolve => snapshots.close(resolve))]);
  }
});

test("fallback proxy strips connection headers and does not read snapshots for private routes", async () => {
  const backend = http.createServer((req, res) => {
    assert.equal(req.headers.authorization, "Bearer test-session");
    assert.equal(req.headers["x-hop-header"], undefined);
    assert.equal(req.url, "/api/user/session?test=1");
    res.writeHead(401, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end(JSON.stringify({ authenticated: false }));
  });
  backend.listen(0, "127.0.0.1");
  await once(backend, "listening");
  const env = { PUBLIC_DATA_MODE: "snapshot", PUBLIC_DATA_DIR: "/nonexistent-test-snapshot", API_PROXY_TARGET: `http://127.0.0.1:${backend.address().port}` };
  try {
    assert.equal(await readPublicApi("/api/user/session", new URLSearchParams(), env), null);
    const request = new Request("http://ui.example/public-data/api/user/session?test=1", { headers: { Connection: "upgrade, x-hop-header", "x-hop-header": "remove-me", Authorization: "Bearer test-session" } });
    const response = await proxyBackendApi(request, "/api/user/session", env);
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { authenticated: false });
  } finally {
    backend.closeAllConnections();
    await new Promise(resolve => backend.close(resolve));
  }
});

test("fetchApiJson returns parsed json for successful responses", async () => {
  const previousFetch = global.fetch;

  global.fetch = async () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  try {
    const payload = await fetchApiJson("/api/ping");
    assert.deepEqual(payload, { ok: true });
  } finally {
    global.fetch = previousFetch;
  }
});

test("fetchApiJson returns fallback for 404 when allowNotFound is enabled", async () => {
  const previousFetch = global.fetch;

  global.fetch = async () => new Response("not found", { status: 404 });

  try {
    const payload = await fetchApiJson("/api/missing", {
      allowNotFound: true,
      fallback: null,
    });
    assert.equal(payload, null);
  } finally {
    global.fetch = previousFetch;
  }
});

test("fetchApiJson returns fallback for network or http errors when provided", async () => {
  const previousFetch = global.fetch;

  global.fetch = async () => new Response("boom", { status: 500 });

  try {
    const payload = await fetchApiJson("/api/failing", {
      fallback: [],
    });
    assert.deepEqual(payload, []);
  } finally {
    global.fetch = previousFetch;
  }
});
