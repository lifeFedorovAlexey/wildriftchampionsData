import test from "node:test";
import assert from "node:assert/strict";
import { eventTone, layoutPatchMarkers, trendTimeDomain } from "../../components/TrendCharts/trend-events-layout.js";

import {
  getAvailableLaneKeys,
  getAvailableRankKeys,
  resolveAvailableTrendFilters,
  buildLinearTrend,
  buildTrendDays,
  mapChampionOptions,
  toNum,
} from "./trends-lib.js";

test("trend filter availability keeps only combinations with champion history", () => {
  const availability = [
    { rank: "diamondPlus", lane: "jungle" },
    { rank: "masterPlus", lane: "jungle" },
    { rank: "masterPlus", lane: "top" },
  ];

  assert.deepEqual(getAvailableRankKeys(availability, "jungle"), ["diamondPlus", "masterPlus"]);
  assert.deepEqual(getAvailableLaneKeys(availability, "masterPlus"), ["jungle", "top"]);
  assert.deepEqual(
    resolveAvailableTrendFilters(availability, { rank: "diamondPlus", lane: "top" }),
    { rank: "diamondPlus", lane: "jungle" },
  );
});

test("toNum normalizes number-like values safely", () => {
  assert.equal(toNum("12.5"), 12.5);
  assert.equal(toNum(undefined, 7), 7);
});

test("patch markers use actual dates between missing daily observations", () => {
  const days = [{ ts: Date.parse("2026-04-01") }, { ts: Date.parse("2026-04-11") }];
  const { markers } = layoutPatchMarkers([{ version: "7.1", date: "2026-04-06", changes: [{}] }], days, 364);
  assert.equal(markers[0].x, 206);
  assert.ok(Number.isFinite(trendTimeDomain([days[0]])[0]));
  assert.notEqual(...trendTimeDomain([days[0]]));
});

test("dense patch markers stay inside mobile width without overlapping", () => {
  const days = [{ ts: Date.parse("2026-04-01") }, { ts: Date.parse("2026-05-01") }];
  const patches = Array.from({ length: 20 }, (_, i) => ({ version: String(i), date: `2026-04-${String(i + 1).padStart(2, "0")}`, changes: [{}, {}, {}, {}] }));
  const { markers } = layoutPatchMarkers(patches, days, 296);
  for (let i = 0; i < markers.length; i++) {
    assert.ok(markers[i].left >= 0 && markers[i].left + markers[i].width <= 296);
    for (const other of markers.slice(i + 1).filter((item) => item.top === markers[i].top)) {
      assert.ok(other.left >= markers[i].left + markers[i].width + 8);
    }
  }
  assert.equal(eventTone("adjustment").symbol, "±");
  assert.equal(eventTone("rework").symbol, "↻");
});

test("buildLinearTrend returns a stable average for flat x values", () => {
  const trend = buildLinearTrend(
    [
      { ts: 1, winRate: 50 },
      { ts: 1, winRate: 52 },
      { ts: 1, winRate: 54 },
    ],
    "winRate"
  );

  assert.deepEqual(trend, [52, 52, 52]);
});

test("mapChampionOptions keeps slug and human-readable display name", () => {
  const options = mapChampionOptions([
    { slug: "ahri", name: "Ahri" },
    { slug: "teemo" },
  ]);

  assert.deepEqual(options, [
    { slug: "ahri", displayName: "Ahri" },
    { slug: "teemo", displayName: "teemo" },
  ]);
});

test("buildTrendDays sorts, filters and appends trend series", () => {
  const days = buildTrendDays(
    [
      { date: "2026-03-20", winRate: 51, pickRate: 4, banRate: 1 },
      { date: "2026-03-18", winRate: 49, pickRate: 3, banRate: 2 },
      { date: "2026-03-19", winRate: 50, pickRate: 5, banRate: 3 },
    ],
    "all"
  );

  assert.deepEqual(
    days.map((day) => day.fullDate),
    ["2026-03-18", "2026-03-19", "2026-03-20"]
  );
  assert.equal(days[0].winTrend, 49);
  assert.equal(days[1].winTrend, 50);
  assert.equal(days[2].winTrend, 51);
  assert.equal(typeof days[0].date, "string");
});
