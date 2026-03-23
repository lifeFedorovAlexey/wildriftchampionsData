import test from "node:test";
import assert from "node:assert/strict";

import {
  buildLinearTrend,
  buildTrendDays,
  mapChampionOptions,
  toNum,
} from "./trends-lib.js";

test("toNum normalizes number-like values safely", () => {
  assert.equal(toNum("12.5"), 12.5);
  assert.equal(toNum(undefined, 7), 7);
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
