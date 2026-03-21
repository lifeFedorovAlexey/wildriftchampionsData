import test from "node:test";
import assert from "node:assert/strict";

import {
  buildLatestStatsMap,
  buildTierBuckets,
  pointsBanrate,
  pointsPickrate,
  pointsWinrate,
  scoreToTier,
} from "./tier-inq-lib.js";

test("tier-inq scoring thresholds stay stable", () => {
  assert.equal(pointsWinrate(55), 6);
  assert.equal(pointsWinrate(50.2), 3);
  assert.equal(pointsPickrate(16), 5);
  assert.equal(pointsBanrate(9), 2);
  assert.equal(scoreToTier(15), "S+");
  assert.equal(scoreToTier(7), "B");
  assert.equal(scoreToTier(0), null);
});

test("buildLatestStatsMap keeps only the newest slice entry per slug rank lane", () => {
  const latest = buildLatestStatsMap([
    {
      slug: "ahri",
      rank: "diamondPlus",
      lane: "mid",
      date: "2026-03-19",
      winRate: 51,
    },
    {
      slug: "ahri",
      rank: "diamondPlus",
      lane: "mid",
      date: "2026-03-20",
      winRate: 52,
    },
    {
      slug: "lux",
      rank: "diamondPlus",
      lane: "support",
      date: "2026-03-18",
      winRate: 50,
    },
  ]);

  assert.equal(latest["ahri|diamondPlus|mid"].winRate, 52);
  assert.equal(latest["lux|diamondPlus|support"].winRate, 50);
});

test("buildTierBuckets computes tiers, sorting and latest visible date", () => {
  const champions = [
    { slug: "ahri", name: "Ahri", icon: "/ahri.png" },
    { slug: "lux", name: "Lux", icon: "/lux.png" },
    { slug: "teemo", name: "Teemo", icon: "/teemo.png" },
  ];

  const latestStats = {
    "ahri|diamondPlus|mid": {
      winRate: 55,
      pickRate: 20,
      banRate: 30,
      date: "2026-03-20",
    },
    "lux|diamondPlus|mid": {
      winRate: 52,
      pickRate: 8,
      banRate: 4,
      date: "2026-03-21",
    },
    "teemo|diamondPlus|mid": {
      winRate: 48.5,
      pickRate: 1.5,
      banRate: 1,
      date: "2026-03-19",
    },
  };

  const { tiers, date } = buildTierBuckets({
    champions,
    latestStats,
    rankKey: "diamondPlus",
    laneKey: "mid",
    weights: { wWin: 1, wPick: 1, wBan: 1 },
  });

  assert.equal(date, "2026-03-21");
  assert.equal(tiers["S+"][0].slug, "ahri");
  assert.equal(tiers.B[0].slug, "lux");
  assert.equal(tiers.D[0].slug, "teemo");
  assert.equal(tiers["S+"][0].totalScore, 17);
});
