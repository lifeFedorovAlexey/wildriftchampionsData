import test from "node:test";
import assert from "node:assert/strict";
import guideShared from "../../shared/guides-shared.js";

import {
  buildChampionLaneMap,
  fetchChampionIndexFromApi,
  fetchChampionNamesFromApi,
  fetchGuideFromApi,
  fetchGuideSlugsFromApi,
  fetchGuideSummariesFromApi,
  hydrateGuideIndexItems,
  findTierLabelForChampion,
  getStatsApiBaseUrl,
  toLaneKey,
} from "./guides-lib.shared.js";

const { getGuideSlugAliases, localizeGuideLane } = guideShared;

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
        items: [{ slug: "ahri" }, { slug: " lux " }, { slug: "wukong" }, { slug: "" }, {}],
      }),
      { status: 200 },
    );

  try {
    const result = await fetchGuideSlugsFromApi();
    assert.deepEqual(result, ["ahri", "lux", "monkeyking"]);
  } finally {
    global.fetch = previousFetch;
  }
});

test("fetchGuideFromApi falls back to alias guide slugs and normalizes champion slug", async () => {
  const previousFetch = global.fetch;
  const requestedUrls = [];

  global.fetch = async (url) => {
    requestedUrls.push(String(url));

    if (String(url).includes("/api/guides/monkeyking?lang=ru_ru")) {
      return new Response("not found", { status: 404 });
    }

    if (String(url).includes("/api/guides/wukong?lang=ru_ru")) {
      return new Response(
        JSON.stringify({
          champion: {
            slug: "wukong",
            name: "Wukong",
          },
        }),
        { status: 200 },
      );
    }

    return new Response("not found", { status: 404 });
  };

  try {
    const result = await fetchGuideFromApi("monkeyking");
    assert.equal(requestedUrls[0]?.includes("/api/guides/monkeyking?lang=ru_ru"), true);
    assert.equal(requestedUrls[1]?.includes("/api/guides/wukong?lang=ru_ru"), true);
    assert.equal(result?.champion?.slug, "monkeyking");
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

test("fetchChampionIndexFromApi requests the lightweight index payload", async () => {
  const previousFetch = global.fetch;
  let requestedUrl = null;

  global.fetch = async (url) => {
    requestedUrl = String(url);
    return new Response(
      JSON.stringify([
        { slug: "nunu", name: "Нуну и Виллумп", roles: ["tank"], iconUrl: "/wr-api/icons/nunu" },
      ]),
      { status: 200 },
    );
  };

  try {
    const result = await fetchChampionIndexFromApi();
    assert.equal(requestedUrl?.includes("/api/champions?lang=ru_ru&fields=index"), true);
    assert.deepEqual(result, [
      { slug: "nunu", name: "Нуну и Виллумп", roles: ["tank"], iconUrl: "/wr-api/icons/nunu" },
    ]);
  } finally {
    global.fetch = previousFetch;
  }
});

test("fetchGuideSummariesFromApi normalizes legacy guide slugs", async () => {
  const previousFetch = global.fetch;

  global.fetch = async () =>
    new Response(
      JSON.stringify({
        items: [
          { slug: "wukong", name: "Wukong", roles: [], availableLanes: ["adc", "mid"] },
          { slug: "ahri", name: "Ahri", roles: [] },
        ],
      }),
      { status: 200 },
    );

  try {
    const result = await fetchGuideSummariesFromApi();
    assert.deepEqual(
      result.map((item) => item.slug),
      ["monkeyking", "ahri"],
    );
    assert.deepEqual(result[0].availableLanes, ["adc", "mid"]);
  } finally {
    global.fetch = previousFetch;
  }
});

test("toLaneKey understands lane labels", () => {
  assert.equal(toLaneKey("Support Lane"), "support");
  assert.equal(toLaneKey("Барон"), "top");
  assert.equal(toLaneKey("Solo"), "top");
  assert.equal(toLaneKey("ADC"), "adc");
  assert.equal(toLaneKey("Дуо"), "adc");
  assert.equal(toLaneKey("лес"), "jungle");
  assert.equal(toLaneKey("unknown"), null);
});

test("shared guide helpers normalize slug aliases and lane labels", () => {
  assert.deepEqual(getGuideSlugAliases("monkeyking"), ["monkeyking", "wukong"]);
  assert.deepEqual(getGuideSlugAliases("wukong"), ["wukong", "monkeyking"]);
  assert.equal(localizeGuideLane("Solo"), "Барон");
  assert.equal(guideShared.localizeGuideRole("Дуо"), "АДК");
  assert.equal(localizeGuideLane("adc"), "Дракон");
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

test("buildChampionLaneMap collects normalized lane buckets from bulk stats", () => {
  const laneMap = buildChampionLaneMap({
    tiersByRankLane: {
      "diamondPlus|top": {
        tiers: {
          S: [{ slug: "aatrox" }],
        },
      },
      "masterPlus|jungle": {
        tiers: {
          A: [{ slug: "aatrox" }, { slug: "leesin" }],
        },
      },
    },
  });

  assert.deepEqual(Array.from(laneMap.get("aatrox") || []), ["top", "jungle"]);
  assert.deepEqual(Array.from(laneMap.get("leesin") || []), ["jungle"]);
});

test("hydrateGuideIndexItems prefers our champion icon over donor guide icon", () => {
  const items = hydrateGuideIndexItems(
    [
      {
        slug: "aatrox",
        name: "Aatrox",
        iconUrl: "https://www.mobafire.com/images/champion/square/aatrox.png",
        roles: ["Барон"],
        availableLanes: ["adc", "mid"],
        patch: "7.0g",
        tier: "S+",
        buildCount: 1,
      },
    ],
    [
      {
        slug: "aatrox",
        name: "Аатрокс",
        roles: ["fighter"],
        iconUrl: "https://cdn.example.com/s3/icons/aatrox.png",
      },
    ],
    {
      tiersByRankLane: {
        "diamondPlus|top": {
          tiers: {
            S: [{ slug: "aatrox" }],
          },
        },
      },
    },
  );

  assert.equal(items[0].iconUrl, "https://cdn.example.com/s3/icons/aatrox.png");
  assert.deepEqual(items[0].laneKeys, ["adc", "mid"]);
  assert.equal(items[0].localizedName, "Аатрокс");
});

test("hydrateGuideIndexItems keeps local champion icons for guide placeholders too", () => {
  const items = hydrateGuideIndexItems(
    [],
    [
      {
        slug: "smolder",
        name: "Смолдер",
        roles: ["marksman"],
        iconUrl: "https://cdn.example.com/s3/icons/smolder.png",
      },
    ],
    {
      tiersByRankLane: {
        "diamondPlus|adc": {
          tiers: {
            S: [{ slug: "smolder" }],
          },
        },
      },
    },
  );

  assert.equal(items[0].iconUrl, "https://cdn.example.com/s3/icons/smolder.png");
  assert.deepEqual(items[0].laneKeys, ["adc"]);
  assert.equal(items[0].hasGuide, false);
});
