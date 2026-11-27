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
