import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GUIDE_LANES, guideEditionStatus, latestOfficialGuidePatch, selectGuideRole, validGuideLevels } from "./guide-role-selection.js";

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

test("the same rollout can contain independently reviewed roles", () => {
  const { roles } = JSON.parse(readFileSync(new URL("./[slug]/approved-guide-data.json", import.meta.url), "utf8")).ambessa;
  for (const role of Object.values(roles)) {
    assert.equal(guideEditionStatus(role.reviewedPatch, "7.3G"), "current");
    assert.equal(guideEditionStatus(role.reviewedPatch, "7.3h"), "archive");
    assert.equal(guideEditionStatus(role.reviewedPatch, "7.3f"), "unverified");
    assert.equal(guideEditionStatus(role.reviewedPatch, null), "unverified");
  }
  assert.equal(guideEditionStatus("7.3h", "7.3h"), "current");
  assert.equal(guideEditionStatus("7.3g", "7.3h"), "archive");
  assert.equal(guideEditionStatus(undefined, "7.3h"), "unverified");
  assert.equal(guideEditionStatus("7.9z", "7.10"), "archive");
});

test("the latest patch ignores malformed versions and unreleased notes and is not tied to order", () => {
  const now = Date.parse("2026-11-27T19:00:00Z");
  const past = "2026-11-25T10:00:00Z";
  assert.equal(latestOfficialGuidePatch([
    { version: "7.4", publishedAt: "2027-01-01" },
    { version: "9.9", publishedAt: null },
    { version: "7.3h", publishedAt: past, effectiveDate: "2026-12-01", effectiveRegion: "global" },
    { version: "7.3F", publishedAt: past },
    { version: "7.3G", publishedAt: past, effectiveDate: "2026-12-01", effectiveRegion: "CN" },
    { version: "Patch 99.1!", publishedAt: past },
  ], now), "7.3g");
  assert.equal(latestOfficialGuidePatch([], now), null);
  assert.equal(latestOfficialGuidePatch(null, now), null);
});

test("only officially changed ranked champions receive exact-version guide notes", async () => {
  const { rankedGuideNotes } = await import("./ranked-patch-guide.js");
  for (const slug of ["vayne", "irelia", "garen", "aurora", "smolder", "sylas"]) {
    assert.equal(rankedGuideNotes(slug, "7.3g").length, 2);
    assert.equal(rankedGuideNotes(slug, "7.3h").length, 0);
    assert.equal(rankedGuideNotes(slug, null).length, 0);
  }
  for (const slug of ["ambessa", "bard", "vi", "sett", "constructor"]) assert.deepEqual(rankedGuideNotes(slug, "7.3g"), []);
});

test("reject complete historical combinations that contain removed ranked equipment", async () => {
  const { containsRemovedRankedEntity } = await import("./ranked-patch-guide.js");
  for (const removed of ["magnetic-blaster", "Soul Transfer", "Legend: Tenacity", "ingenious-hunter"]) {
    assert.ok(containsRemovedRankedEntity(["eclipse", removed]));
  }
  assert.ok(!containsRemovedRankedEntity(["eclipse", "legend-haste", "rapid-firecannon"]));
});

test("equipment notes follow exact archive lane and current official patch, never another role", async () => {
  const { rankedGearNotes, hasRankedGearNotes } = await import("./ranked-patch-gear.js");
  const coverage = JSON.parse(readFileSync(new URL("./ranked-patch-gear-scope.json", import.meta.url), "utf8"));
  assert.equal(Object.keys(coverage).length, 61);
  assert.equal(Object.values(coverage).reduce((n, roles) => n + Object.keys(roles).length, 0), 82);
  assert.ok(hasRankedGearNotes("vayne"));
  assert.ok(rankedGearNotes("vayne", "adc", "7.3g").some(([label]) => label.includes("Гинсу")));
  assert.deepEqual(rankedGearNotes("vayne", "jungle", "7.3g"), []);
  assert.deepEqual(rankedGearNotes("ambessa", "top", "7.3g"), []);
  assert.deepEqual(rankedGearNotes("ambessa", "jungle", "7.3h"), []);
  assert.deepEqual(rankedGearNotes("constructor", "jungle", "7.3g"), []);
  for (const [champion, roles] of Object.entries(coverage)) {
    for (const [lane, ids] of Object.entries(roles)) {
      assert.ok(GUIDE_LANES.includes(lane));
      assert.equal(rankedGearNotes(champion, lane, "7.3g").length, ids.length);
    }
  }
});

test("generic passive slug cannot make Vayne use Olaf's tooltip or icon", async () => {
  const { resolveGuideAbilityTooltip } = await import("./guide-ability-tooltip.js");
  const repair = (text) => text ?? "";
  const vayne = { slug: "passive", name: "НОЧНАЯ ОХОТНИЦА", description: "Вейн ускоряется по направлению к противнику.", iconUrl: "/vayne.png" };
  const olaf = { slug: "passive", name: "Ярость берсерка", imageUrl: "/olaf.png", tooltip: { title: "Ярость берсерка", stats: ["Олаф"], lines: ["Скорость атаки"] } };
  assert.deepEqual(resolveGuideAbilityTooltip(vayne, olaf, repair), {
    imageUrl: "/vayne.png", tooltip: { title: "НОЧНАЯ ОХОТНИЦА", lines: [vayne.description] },
  });
  assert.deepEqual(resolveGuideAbilityTooltip({ ...vayne, description: null, iconUrl: null }, olaf, repair), {
    imageUrl: null, tooltip: null,
  });
  const match = { slug: "passive", name: "Ночная охотница", tooltip: { title: "Ночная охотница", stats: ["Вейн"] } };
  assert.deepEqual(resolveGuideAbilityTooltip(vayne, match, repair).tooltip, match.tooltip);
  assert.deepEqual(resolveGuideAbilityTooltip(vayne, { ...match, tooltip: olaf.tooltip }, repair).tooltip.lines, [vayne.description]);
});

test("unlabelled archive stays separate and never leaks into another selected role", async () => {
  const { selectUnassignedGuideArchive } = await import("./guide-available-content.js");
  const variants = [{ lane: "top" }, { lane: null }, { lane: "jungle" }];
  assert.deepEqual(selectUnassignedGuideArchive(variants, "top", "top", x => x.lane), [variants[1]]);
  assert.deepEqual(selectUnassignedGuideArchive(variants, "jungle", "top", x => x.lane), []);
  assert.deepEqual(selectGuideRole(variants, "top", x => x.lane), [variants[0]]);
});

test("ranked context requires a dated matching champion, exact lane, and Diamond+", async () => {
  const { findGuideRankedContext } = await import("./guide-available-content.js");
  const base = { slug: "mordekaiser", lane: "top", rank: "diamondPlus", date: "2026-11-26", winRate: 51.51, pickRate: 10.31 };
  const now = Date.parse("2026-11-27T22:20:00Z");
  const bucket = (lane, rows) => ({ lane, rank: "diamondPlus", tiers: { S: rows } });
  const bulk = { tiersByRankLane: {
    "diamondPlus|top": bucket("top", [
      { ...base, date: "2026-11-01" }, { ...base, date: "2026-11-28" },
      { ...base, rank: "masterPlus" }, { ...base, slug: "garen" }, base,
    ]),
    "diamondPlus|jungle": bucket("jungle", [base, { ...base, lane: "jungle", date: "2026-11-31" }]),
  } };
  assert.deepEqual(findGuideRankedContext(bulk, "mordekaiser", x => x, now), {
    top: { date: "2026-11-26", winRate: 51.51, pickRate: 10.31 },
  });
});

test("Mordekaiser Baron renders an evidenced core, five runes, spells, a full grid and ten matchups", () => {
  const data = JSON.parse(readFileSync(new URL("./[slug]/approved-guide-data.json", import.meta.url), "utf8")).mordekaiser;
  assert.deepEqual(Object.keys(data.roles), ["top"]);
  const guide = data.roles.top;
  assert.equal(guide.reviewedPatch, "7.3g");
  assert.deepEqual(guide.items.map(items => items.length), [3, 3, 3]);
  assert.equal(guide.runePages.length, 3);
  assert.match(guide.itemNote, /показаны отдельно/);
  assert.equal(guide.runes.length, 5);
  assert.equal(guide.spells.length, 2);
  assert.ok(validGuideLevels(guide.levels.map((x, i) => ({...x, level: i + 1}))));
  assert.deepEqual(guide.groups.map(x => x.cards.length), [5, 5]);
  for (const x of guide.groups.flatMap(g => g.cards)) {
    assert.equal(x.win, null);
    assert.equal(x.tips.length, 3);
  }
});


test("a page missing a build, a distinct rune page or a matchup fails the release gate", async () => {
  const { hasGuideReleaseMinimum } = await import("./guide-role-selection.js");
  const data = JSON.parse(readFileSync(new URL("./[slug]/approved-guide-data.json", import.meta.url), "utf8"));
  const guide = data.mordekaiser.roles.top;
  assert.ok(hasGuideReleaseMinimum(guide));
  assert.equal(hasGuideReleaseMinimum(data.ambessa.roles.top), false);
  assert.equal(hasGuideReleaseMinimum({...guide, items: guide.items.slice(0, 2)}), false);
  assert.equal(hasGuideReleaseMinimum({...guide, runePages: [guide.runePages[0], guide.runePages[1], guide.runePages[1]]}), false);
  assert.equal(hasGuideReleaseMinimum({...guide, groups: [guide.groups[0], {...guide.groups[1], cards: guide.groups[1].cards.slice(1)}]}), false);
});
