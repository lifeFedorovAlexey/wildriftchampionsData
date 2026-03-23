import test from "node:test";
import assert from "node:assert/strict";

import { pickCurrentTiers } from "./tierlist-lib.js";

test("pickCurrentTiers returns the bucket for the selected rank and lane", () => {
  const data = {
    tiersByRankLane: {
      "diamondPlus|top": {
        tiers: {
          "S+": [{ slug: "teemo" }],
          S: [],
          A: [],
          B: [],
          C: [],
          D: [],
        },
      },
    },
  };

  const current = pickCurrentTiers(data, "diamondPlus", "top");
  assert.equal(current?.["S+"]?.[0]?.slug, "teemo");
});

test("pickCurrentTiers returns null when the slice is missing", () => {
  assert.equal(pickCurrentTiers(null, "diamondPlus", "top"), null);
  assert.equal(
    pickCurrentTiers({ tiersByRankLane: {} }, "diamondPlus", "top"),
    null,
  );
});
