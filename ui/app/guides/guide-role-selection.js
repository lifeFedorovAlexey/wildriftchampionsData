export const GUIDE_LANES = Object.freeze(["top", "jungle", "mid", "adc", "support"]);

// A role with no entry stays empty; never borrow the default role's inventory.
export function selectGuideRole(entries, role, laneOf) {
  return GUIDE_LANES.includes(role) ? entries.filter((entry) => laneOf(entry) === role) : [];
}

export function validGuideLevels(levels) {
  if (!Array.isArray(levels) || levels.length !== 15) return false;
  if (!levels.every((entry, i) => entry.level === i + 1 && ["Q", "W", "E", "R"].includes(entry.key))) return false;
  return levels.filter((x) => x.key === "R").map((x) => x.level).join() === "5,9,13";
}


export function normalizeGuidePatch(value) {
  if (typeof value !== "string") return null;
  const match = /^(\d{1,3})\.(\d{1,3})([a-z]?)$/i.exec(value.trim());
  return match ? `${Number(match[1])}.${Number(match[2])}${match[3].toLowerCase()}` : null;
}

// An older/unavailable catalog cannot verify the edition, nor prove it is outdated.
export function guideEditionStatus(reviewedPatch, latestPatch) {
  const reviewed = normalizeGuidePatch(reviewedPatch);
  const latest = normalizeGuidePatch(latestPatch);
  if (!reviewed || !latest) return "unverified";
  const order = compareGuidePatches(reviewed, latest);
  return order === 0 ? "current" : order < 0 ? "archive" : "unverified";
}

function compareGuidePatches(a, b) {
  const keys = (value) => {
    const [major, minor, suffix] = /^(\d+)\.(\d+)([a-z]?)$/.exec(value).slice(1);
    return [Number(major), Number(minor), suffix ? suffix.charCodeAt(0) : 0];
  };
  const [aMajor, aMinor, aSuffix] = keys(a);
  const [bMajor, bMinor, bSuffix] = keys(b);
  return aMajor - bMajor || aMinor - bMinor || aSuffix - bSuffix;
}

export function latestOfficialGuidePatch(rows, now = Date.now()) {
  let latest = null;
  for (const row of Array.isArray(rows) ? rows : []) {
    const patch = normalizeGuidePatch(row?.version);
    const published = typeof row?.publishedAt === "string" ? Date.parse(row.publishedAt) : NaN;
    if (!patch || !Number.isFinite(published) || published > now) continue;
    // The site's regional CN effective date is not a global live date.
    if (String(row.effectiveRegion ?? "").toUpperCase() === "GLOBAL") {
      const effective = Date.parse(row.effectiveDate);
      if (Number.isFinite(effective) && effective > now) continue;
    }
    if (!latest || compareGuidePatches(patch, latest) > 0) latest = patch;
  }
  return latest;
}

/** Structural release minimum. It does not attest to source accuracy. */
export function hasGuideReleaseMinimum(guide) {
  const nonempty = (text) => typeof text === "string" && text.trim().length > 0;
  const canonical = (row) => row.map(({ name }) => name.trim().toLocaleLowerCase("ru-RU")).sort().join("|");
  const exact = (row, count) => Array.isArray(row) && row.length === count &&
    row.every((item) => nonempty(item?.name) && Number.isInteger(item.icon) && item.icon >= 0) &&
    new Set(row.map((item) => item.name.trim().toLocaleLowerCase("ru-RU"))).size === count;
  if (!Array.isArray(guide?.items) || guide.items.length !== 3 ||
      !guide.items.every((items) => exact(items, 3)) || new Set(guide.items.map(canonical)).size !== 3 ||
      !Array.isArray(guide.itemWhen) || guide.itemWhen.length !== 3 || !guide.itemWhen.every(nonempty)) return false;
  const expected = guide.expectedRunePages ?? 3;
  if (![1,2,3].includes(expected) || !Array.isArray(guide.runePages) || guide.runePages.length !== expected ||
      !guide.runePages.every((page) => nonempty(page?.label) && nonempty(page?.note))) return false;
  const pages = guide.runePages.map((page, i) => page.list ?? (i === 0 ? guide.runes : null));
  if (!pages.every((page) => exact(page, 5)) || new Set(pages.map(canonical)).size !== expected ||
      !exact(guide.spells, 2) || !Array.isArray(guide.levels) ||
      !validGuideLevels(guide.levels.map((x, i) => ({ ...x, level: i + 1 })))) return false;
  if (!Array.isArray(guide.groups) || guide.groups.length !== 2 ||
      !guide.groups.every((g, i) => g?.title === ["Сложнее", "Удобнее"][i] && Array.isArray(g.cards) && g.cards.length === 5)) return false;
  const all = guide.groups.flatMap((g) => g.cards);
  return all.every(x => nonempty(x?.name) && nonempty(x.headline) &&
    Array.isArray(x.tips) && x.tips.length === 3 && x.tips.every(nonempty)) &&
    new Set(all.map((x) => x.name.trim().toLocaleLowerCase("ru-RU"))).size === 10;
}
