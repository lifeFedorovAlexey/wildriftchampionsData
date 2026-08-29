import test from "node:test";
import assert from "node:assert/strict";

import {
  LANE_OPTIONS,
  RANK_OPTIONS,
  buildWorkflowOptions,
} from "./workflow-options.js";

test("workflow options expose only site-native filters present in the stats snapshot", () => {
  const payload = buildWorkflowOptions({
    snapshotId: 1874,
    items: [
      { lane: "support", rank: "overall" },
      { lane: "mid", rank: "diamondPlus" },
      { lane: "unknown", rank: "unknown" },
    ],
  });

  assert.deepEqual(payload, {
    version: 1,
    source: "wildriftallstats.ru",
    statsSnapshotId: 1874,
    lanes: [
      { id: "mid", label: "Мид" },
      { id: "support", label: "Поддержка" },
    ],
    ranks: [
      { id: "diamondPlus", label: "Алмаз" },
      { id: "overall", label: "Все" },
    ],
  });
});

test("workflow options reject a missing or empty snapshot", () => {
  assert.throws(() => buildWorkflowOptions(null), /workflow_options_snapshot_unavailable/);
  assert.throws(() => buildWorkflowOptions({ items: [] }), /workflow_options_snapshot_unavailable/);
});

test("workflow options keep the canonical site order and labels", () => {
  assert.deepEqual(LANE_OPTIONS.map(({ key, label }) => [key, label]), [
    ["top", "Топ"],
    ["jungle", "Лес"],
    ["mid", "Мид"],
    ["adc", "Стрелок"],
    ["support", "Поддержка"],
  ]);
  assert.deepEqual(RANK_OPTIONS.map(({ key, label }) => [key, label]), [
    ["diamondPlus", "Алмаз"],
    ["masterPlus", "Мастер"],
    ["king", "ГМ"],
    ["peak", "Претендент"],
    ["overall", "Все"],
  ]);
});
