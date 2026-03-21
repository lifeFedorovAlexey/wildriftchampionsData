import test from "node:test";
import assert from "node:assert/strict";

import {
  applyPreparedMovement,
  buildLatestMap,
  buildPreparedWinrateSlices,
  buildStatsUrls,
  buildWinrateRows,
  nextSortState,
  normalizeIconSrc,
  sortPreparedRows,
  strengthToTier,
} from "./winrates-lib.js";

test("buildLatestMap keeps the latest record for each rank/lane slice", () => {
  const items = [
    {
      slug: "ahri",
      rank: "diamondPlus",
      lane: "mid",
      date: "2026-03-14",
      winRate: 49.2,
    },
    {
      slug: "ahri",
      rank: "diamondPlus",
      lane: "mid",
      date: "2026-03-15",
      winRate: 50.1,
    },
    {
      slug: "lux",
      rank: "diamondPlus",
      lane: "mid",
      date: "2026-03-15",
      winRate: 51.3,
    },
    {
      slug: "ahri",
      rank: "king",
      lane: "mid",
      date: "2026-03-13",
      winRate: 52.4,
    },
  ];

  const latest = buildLatestMap(items);

  assert.equal(latest["ahri|diamondPlus|mid"].winRate, 50.1);
  assert.equal(latest["lux|diamondPlus|mid"].winRate, 51.3);
  assert.equal(latest["ahri|king|mid"].winRate, 52.4);
});

test("buildStatsUrls prefers explicit API origin and trims trailing slash", () => {
  const urls = buildStatsUrls("ru_ru", {
    STATS_API_ORIGIN: "https://stats.example.com/",
  });

  assert.equal(
    urls.championsUrl,
    "https://stats.example.com/api/champions?lang=ru_ru",
  );
  assert.equal(
    urls.historyUrl,
    "https://stats.example.com/api/winrates-snapshot",
  );
  assert.equal(
    urls.updatedAtUrl,
    "https://stats.example.com/api/updated-at",
  );
});

test("normalizeIconSrc keeps proxy paths stable", () => {
  assert.equal(
    normalizeIconSrc("/wr-api/icons/ahri.png"),
    "/wr-api/icons/ahri.png",
  );
  assert.equal(
    normalizeIconSrc("https://wildriftallstats.ru/wr-api/icons/ahri.png?v=2"),
    "/wr-api/icons/ahri.png?v=2",
  );
});

test("nextSortState rotates desc -> asc -> reset", () => {
  assert.deepEqual(nextSortState({ column: null, dir: null }, "winRate"), {
    column: "winRate",
    dir: "desc",
  });
  assert.deepEqual(
    nextSortState({ column: "winRate", dir: "desc" }, "winRate"),
    {
      column: "winRate",
      dir: "asc",
    },
  );
  assert.deepEqual(
    nextSortState({ column: "winRate", dir: "asc" }, "winRate"),
    {
      column: null,
      dir: null,
    },
  );
});

test("buildWinrateRows applies tier mapping, sorting and weekly position delta", () => {
  const champions = [
    { slug: "ahri", name: "Ahri", icon: "/ahri.png" },
    { slug: "lux", name: "Lux", icon: "/lux.png" },
    { slug: "teemo", name: "Teemo", icon: "/teemo.png" },
  ];

  const historyItems = [
    {
      slug: "ahri",
      rank: "diamondPlus",
      lane: "mid",
      date: "2026-03-08",
      winRate: 51.1,
      pickRate: 10.1,
      banRate: 3.4,
      strengthLevel: 2,
    },
    {
      slug: "lux",
      rank: "diamondPlus",
      lane: "mid",
      date: "2026-03-08",
      winRate: 53.8,
      pickRate: 9.4,
      banRate: 7.1,
      strengthLevel: 0,
    },
    {
      slug: "teemo",
      rank: "diamondPlus",
      lane: "mid",
      date: "2026-03-08",
      winRate: 50.4,
      pickRate: 5.9,
      banRate: 12.1,
      strengthLevel: 4,
    },
    {
      slug: "ahri",
      rank: "diamondPlus",
      lane: "mid",
      date: "2026-03-15",
      winRate: 54.2,
      pickRate: 11.1,
      banRate: 4.4,
      strengthLevel: 2,
    },
    {
      slug: "lux",
      rank: "diamondPlus",
      lane: "mid",
      date: "2026-03-15",
      winRate: 52.8,
      pickRate: 9.4,
      banRate: 7.1,
      strengthLevel: 0,
    },
    {
      slug: "teemo",
      rank: "diamondPlus",
      lane: "mid",
      date: "2026-03-15",
      winRate: 49.8,
      pickRate: 7.2,
      banRate: 14.6,
      strengthLevel: 4,
    },
  ];

  const rows = buildWinrateRows({
    champions,
    latestStats: buildLatestMap(historyItems),
    historyItems,
    rankKey: "diamondPlus",
    laneKey: "mid",
    sort: { column: "winRate", dir: "desc" },
  });

  assert.equal(rows[0].slug, "ahri");
  assert.equal(rows[0].tierLabel, "A");
  assert.equal(rows[0].positionDelta, 1);
  assert.equal(rows[1].slug, "lux");
  assert.equal(rows[1].positionDelta, -1);
});

test("buildPreparedWinrateSlices precomputes per-slice rows from snapshot positions", () => {
  const champions = [
    { slug: "ahri", name: "Ahri", icon: "/ahri.png" },
    { slug: "lux", name: "Lux", icon: "/lux.png" },
  ];

  const historyItems = [
    {
      slug: "ahri",
      rank: "diamondPlus",
      lane: "mid",
      date: "2026-03-09",
      position: 2,
      winRate: 50.4,
      strengthLevel: 2,
    },
    {
      slug: "lux",
      rank: "diamondPlus",
      lane: "mid",
      date: "2026-03-09",
      position: 1,
      winRate: 52.1,
      strengthLevel: 0,
    },
    {
      slug: "ahri",
      rank: "diamondPlus",
      lane: "mid",
      date: "2026-03-15",
      position: 1,
      winRate: 53.2,
      strengthLevel: 2,
    },
    {
      slug: "lux",
      rank: "diamondPlus",
      lane: "mid",
      date: "2026-03-15",
      position: 2,
      winRate: 51.6,
      strengthLevel: 0,
    },
  ];

  const { rowsBySlice, maxRowCount } = buildPreparedWinrateSlices({
    champions,
    historyItems,
  });

  assert.equal(maxRowCount, 2);
  assert.equal(rowsBySlice["diamondPlus|mid"][0].slug, "ahri");
  assert.equal(rowsBySlice["diamondPlus|mid"][0].positionDelta, null);
  assert.deepEqual(rowsBySlice["diamondPlus|mid"][0].positionTrend, []);
});

test("sortPreparedRows only reorders precomputed rows on the client", () => {
  const rows = [
    {
      slug: "ahri",
      winRate: 51.1,
      pickRate: 2.1,
      banRate: 1.2,
      strengthLevel: 2,
    },
    {
      slug: "lux",
      winRate: 53.4,
      pickRate: 4.1,
      banRate: 3.2,
      strengthLevel: 0,
    },
  ];

  const sorted = sortPreparedRows(rows, { column: "winRate", dir: "desc" });

  assert.equal(sorted[0].slug, "lux");
  assert.equal(sorted[1].slug, "ahri");
});

test("applyPreparedMovement restores trend and delta from prepared slice history", () => {
  const rows = [
    {
      slug: "ahri",
      name: "Ahri",
      icon: "/ahri.png",
      winRate: 53.2,
      pickRate: 3.2,
      banRate: 1.1,
      strengthLevel: 2,
      tierLabel: "A",
      tierColor: "#facc15",
      positionDelta: null,
      positionTrend: [],
    },
    {
      slug: "lux",
      name: "Lux",
      icon: "/lux.png",
      winRate: 51.6,
      pickRate: 4.1,
      banRate: 0.9,
      strengthLevel: 0,
      tierLabel: "S+",
      tierColor: "#fb7185",
      positionDelta: null,
      positionTrend: [],
    },
  ];

  const sliceHistory = [
    {
      date: "2026-03-09",
      rows: [
        { ...rows[0], winRate: 50.4 },
        { ...rows[1], winRate: 52.1 },
      ],
    },
    {
      date: "2026-03-15",
      rows,
    },
  ];

  const prepared = applyPreparedMovement(
    sortPreparedRows(rows, { column: "winRate", dir: "desc" }),
    sliceHistory,
    { column: "winRate", dir: "desc" },
  );

  assert.equal(prepared[0].slug, "ahri");
  assert.equal(prepared[0].positionDelta, 1);
  assert.deepEqual(prepared[0].positionTrend, [2, 1]);
});

test("strengthToTier returns a neutral placeholder for missing values", () => {
  assert.deepEqual(strengthToTier(null), { label: "—", color: "#94a3b8" });
});
