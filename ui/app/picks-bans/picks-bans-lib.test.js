import test from "node:test";
import assert from "node:assert/strict";

import {
  aggregateLatestPicksBans,
  buildLaneDetails,
} from "./picks-bans-lib.js";

test("aggregateLatestPicksBans groups latest snapshot rows by slug and rank range", () => {
  const champions = [
    { slug: "ahri", name: "Ahri" },
    { slug: "lux", name: "Lux" },
  ];

  const latestItems = [
    {
      slug: "ahri",
      rank: "diamondPlus",
      lane: "mid",
      pickRate: 12,
      banRate: 4,
    },
    {
      slug: "ahri",
      rank: "masterPlus",
      lane: "support",
      pickRate: 6,
      banRate: 8,
    },
    {
      slug: "ahri",
      rank: "king",
      lane: "mid",
      pickRate: 2,
      banRate: 12,
    },
    {
      slug: "lux",
      rank: "diamondPlus",
      lane: "mid",
      pickRate: 10,
      banRate: 3,
    },
  ];

  const lowOnly = aggregateLatestPicksBans({
    latestItems,
    champions,
    rankRange: "low",
  });

  const ahriLow = lowOnly.find((item) => item.slug === "ahri");
  assert.equal(ahriLow.totalPickRate, 9);
  assert.equal(ahriLow.totalBanRate, 6);
  assert.equal(ahriLow.lanes.mid.pick, 12);
  assert.equal(ahriLow.lanes.support.pick, 6);

  const allRanks = aggregateLatestPicksBans({
    latestItems,
    champions,
    rankRange: "all",
  });

  const ahriAll = allRanks.find((item) => item.slug === "ahri");
  assert.equal(Number(ahriAll.totalPickRate.toFixed(2)), 6.67);
  assert.equal(Number(ahriAll.totalBanRate.toFixed(2)), 8);
});

test("buildLaneDetails formats and sorts modal lane breakdown", () => {
  const champ = {
    lanes: {
      mid: {
        pick: 12,
        ban: 3,
        pickRanks: { diamondPlus: 10, masterPlus: 14 },
        banRanks: { diamondPlus: 3 },
      },
      support: {
        pick: 6,
        ban: 1,
        pickRanks: { masterPlus: 6 },
        banRanks: { masterPlus: 1 },
      },
      all: {
        pick: 0,
        ban: 8,
        pickRanks: {},
        banRanks: { diamondPlus: 3, masterPlus: 5 },
      },
    },
  };

  const pickDetails = buildLaneDetails({ champ, type: "pick" });
  assert.equal(pickDetails[0].laneKey, "mid");
  assert.equal(pickDetails[0].laneTotal, 12);
  assert.deepEqual(pickDetails[0].parts, ["Алмаз: 10.00%", "Мастер: 14.00%"]);

  const banDetails = buildLaneDetails({ champ, type: "ban" });
  assert.equal(banDetails[0].laneKey, "all");
  assert.equal(banDetails[0].displayLaneName, "все линии");
  assert.deepEqual(banDetails[0].parts, ["Алмаз: 3.00%", "Мастер: 5.00%"]);
});
