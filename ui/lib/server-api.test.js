import test from "node:test";
import assert from "node:assert/strict";

import { buildApiUrl, fetchApiJson } from "./server-api.js";

test("buildApiUrl uses stats api origin and trims trailing slash", () => {
  const url = buildApiUrl("/api/news", {
    STATS_API_ORIGIN: "https://stats.example.com/",
  });

  assert.equal(url, "https://stats.example.com/api/news");
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
