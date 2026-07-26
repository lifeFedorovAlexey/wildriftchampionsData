import test from "node:test";
import assert from "node:assert/strict";

import { buildChampionMetaSlices } from "./streamer-stats-lib.js";

const row = (slug, winRate, pickRate, banRate) => ({
  slug,
  winRate,
  pickRate,
  banRate,
  winRateTrend: [49, winRate],
  pickRateTrend: [5, pickRate],
  banRateTrend: [2, banRate],
});

test("buildChampionMetaSlices keeps only current real rank and lane slices", () => {
  const slices = buildChampionMetaSlices({
    slug: "akshan",
    dates: ["2026-07-23", "2026-07-24"],
    rowsBySlice: {
      "overall|overall": [row("akshan", 50, 7, 3)],
      "diamondPlus|mid": [row("akshan", 51, 8, 4)],
      "masterPlus|mid": [row("akshan", 52, 6, 5)],
      "king|top": [row("other", 55, 9, 1)],
      "peak|support": [],
    },
  });

  assert.deepEqual(
    slices.map(({ rankKey, laneKey }) => ({ rankKey, laneKey })),
    [
      { rankKey: "diamondPlus", laneKey: "mid" },
      { rankKey: "masterPlus", laneKey: "mid" },
    ],
  );
  assert.equal(slices[0].days.at(-1).winRate, 51);
  assert.equal(slices[0].days.at(-1).pickRateDelta, 3);
});

test("buildChampionMetaSlices removes slices without current metrics", () => {
  const slices = buildChampionMetaSlices({
    slug: "akshan",
    dates: ["2026-07-24"],
    rowsBySlice: {
      "diamondPlus|mid": [row("akshan", null, null, null)],
      "masterPlus|jungle": [row("akshan", 50, null, null)],
    },
  });

  assert.deepEqual(slices.map(({ rankKey, laneKey }) => ({ rankKey, laneKey })), [
    { rankKey: "masterPlus", laneKey: "jungle" },
  ]);
});
