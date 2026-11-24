import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_STATS_API_ORIGIN,
  getStatsApiBaseUrl,
} from "./stats-api-origin.js";

test("getStatsApiBaseUrl prefers API_PROXY_TARGET and trims trailing slash", () => {
  const result = getStatsApiBaseUrl({
    API_PROXY_TARGET: "https://proxy.example.com/",
    STATS_API_ORIGIN: "https://stats.example.com/",
  });

  assert.equal(result, "https://proxy.example.com");
});

test("getStatsApiBaseUrl supports extra keys for specialized flows", () => {
  const result = getStatsApiBaseUrl(
    {
      GUIDES_SYNC_API_ORIGIN: "https://sync.example.com/",
      API_PROXY_TARGET: "https://proxy.example.com/",
    },
    { extraKeys: ["GUIDES_SYNC_API_ORIGIN"] },
  );

  assert.equal(result, "https://sync.example.com");
});

test("getStatsApiBaseUrl falls back to default origin", () => {
  assert.equal(getStatsApiBaseUrl({}), DEFAULT_STATS_API_ORIGIN);
});

test("snapshot mode uses the internal local public-data route before api origins", () => {
  assert.equal(
    getStatsApiBaseUrl({
      PUBLIC_DATA_MODE: "snapshot",
      PUBLIC_DATA_ORIGIN: "http://127.0.0.1:3000/public-data/",
      API_PROXY_TARGET: "https://api.example.com/",
    }),
    "http://127.0.0.1:3000/public-data",
  );
});
