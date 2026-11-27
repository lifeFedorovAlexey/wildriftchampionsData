import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GUIDE_LANES, selectGuideRole, validGuideLevels } from "./guide-role-selection.js";

test("all five roles are available; selecting a missing role shows no foreign build", () => {
  const cases = [{ lane: "top", default: true }, { lane: "jungle" }, { lane: null }];
  assert.equal(GUIDE_LANES.length, 5);
  assert.deepEqual(selectGuideRole(cases, "jungle", x => x.lane), [cases[1]]);
  for (const role of ["mid", "adc", "support", "other"]) {
    assert.deepEqual(selectGuideRole(cases, role, x => x.lane), []);
  }
});

test("approved builds have two isolated role cards, levels, and 5+5 matchups", () => {
  const pilot = JSON.parse(readFileSync(new URL("./[slug]/approved-guide-data.json", import.meta.url), "utf8")).ambessa;
  assert.deepEqual(Object.keys(pilot.roles), ["top", "jungle"]);
  for (const role of Object.values(pilot.roles)) {
    const levels = role.levels.map((x, i) => ({ ...x, level: i + 1 }));
    assert.equal(validGuideLevels(levels), true);
    assert.equal(validGuideLevels([...levels.slice(0, -1), levels[0]]), false);
    assert.deepEqual(role.groups.map(g => g.cards.length), [5, 5]);
    assert.equal(new Set(role.groups.flatMap(g => g.cards.map(c => c.name))).size, 10);
    assert.ok(role.groups.every(g => g.cards.every(c => c.tips.length === 3)));
  }
  assert.equal(pilot.roles.top.groups.flatMap(g => g.cards).filter(c => c.win !== null).length, 6);
  assert.ok(pilot.roles.jungle.groups.flatMap(g => g.cards).every(c => c.win === null));
});
