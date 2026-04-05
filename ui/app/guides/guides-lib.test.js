import test from "node:test";
import assert from "node:assert/strict";

import {
  fetchChampionNamesFromApi,
  fetchGuideSlugsFromApi,
  findTierLabelForChampion,
  getStatsApiBaseUrl,
  toLaneKey,
} from "./guides-lib.shared.js";

function withEnv(env, fn) {
  const previous = {
    API_PROXY_TARGET: process.env.API_PROXY_TARGET,
    NEXT_PUBLIC_STATS_API_ORIGIN: process.env.NEXT_PUBLIC_STATS_API_ORIGIN,
    STATS_API_ORIGIN: process.env.STATS_API_ORIGIN,
    NEXT_PUBLIC_API_ORIGIN: process.env.NEXT_PUBLIC_API_ORIGIN,
    API_ORIGIN: process.env.API_ORIGIN,
  };

  Object.assign(process.env, env);

  try {
    return fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value == null) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("getStatsApiBaseUrl prefers API_PROXY_TARGET and trims trailing slash", () => {
  withEnv(
    {
      API_PROXY_TARGET: "https://proxy.example.com/",
      STATS_API_ORIGIN: "https://stats.example.com/",
    },
    () => {
      assert.equal(getStatsApiBaseUrl(), "https://proxy.example.com");
    },
  );
});

test("fetchGuideSlugsFromApi supports object payload and trims empty slugs", async () => {
  const previousFetch = global.fetch;

  global.fetch = async () =>
    new Response(
      JSON.stringify({
        items: [{ slug: "ahri" }, { slug: " lux " }, { slug: "" }, {}],
      }),
      { status: 200 },
    );

  try {
    const result = await fetchGuideSlugsFromApi();
    assert.deepEqual(result, ["ahri", "lux"]);
  } finally {
    global.fetch = previousFetch;
  }
});

test("fetchChampionNamesFromApi builds a slug-name map", async () => {
  const previousFetch = global.fetch;
  let requestedUrl = null;

  global.fetch = async (url) => {
    requestedUrl = String(url);
    return new Response(
      JSON.stringify([
        { slug: "lux", name: "Люкс" },
        { slug: "ahri", name: "Ари" },
        { slug: "", name: "skip" },
      ]),
      { status: 200 },
    );
  };

  try {
    const result = await fetchChampionNamesFromApi();
    assert.equal(requestedUrl?.includes("/api/champions?lang=ru_ru&fields=names"), true);
    assert.deepEqual(result, {
      lux: "Люкс",
      ahri: "Ари",
    });
  } finally {
    global.fetch = previousFetch;
  }
});

test("toLaneKey understands lane labels", () => {
  assert.equal(toLaneKey("Support Lane"), "support");
  assert.equal(toLaneKey("Барон"), "top");
  assert.equal(toLaneKey("ADC"), "adc");
  assert.equal(toLaneKey("лес"), "jungle");
  assert.equal(toLaneKey("unknown"), null);
});

test("findTierLabelForChampion finds a champion tier by lane slice", () => {
  const bulk = {
    tiersByRankLane: {
      "diamondPlus|mid": {
        rank: "diamondPlus",
        lane: "mid",
        tiers: {
          S: [{ slug: "ahri" }],
          A: [{ slug: "lux" }],
        },
      },
    },
  };

  assert.equal(findTierLabelForChampion(bulk, "ahri", "mid"), "S");
  assert.equal(findTierLabelForChampion(bulk, "lux", "mid"), "A");
  assert.equal(findTierLabelForChampion(bulk, "teemo", "mid"), null);
  assert.equal(findTierLabelForChampion(bulk, "ahri", null), null);
});
