import { GUIDE_LANES } from "./guide-role-selection.js";

/** Return the current dated ranked context for these exact champion and lane keys; no cross-role fallback. */
export function findGuideRankedContext(bulk, slug, normalizeSlug, now = Date.now()) {
  const source = { ...bulk?.tiersByRankLane };
  const windows = /** @type {Record<string, {date: string, winRate: number, pickRate: number}>} */ ({});
  for (const lane of GUIDE_LANES) {
    const bucket = source["diamondPlus|" + lane];
    if (bucket?.rank !== "diamondPlus" || bucket?.lane !== lane) continue;
    for (const group of Object.values(bucket.tiers || {})) {
      for (const row of Array.isArray(group) ? group : []) {
        if (normalizeSlug(row.slug) !== slug || row.lane !== lane || row.rank !== "diamondPlus") continue;
        const date = typeof row.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(row.date) ? Date.parse(row.date) : NaN;
        if (!Number.isFinite(date) || new Date(date).toISOString().slice(0,10) !== row.date || date > now || now - date > 7 * 86400000) continue;
        if (![row.winRate, row.pickRate].every(x => typeof x === "number" && Number.isFinite(x) && x >= 0 && x <= 100)) continue;
        if (!windows[lane] || row.date > windows[lane].date) windows[lane] = { date: row.date, winRate: row.winRate, pickRate: row.pickRate };
      }
    }
  }
  return windows;
}

/** Unlabeled builds remain unassigned; show them only in the default tab in a separate archive. */
export function selectUnassignedGuideArchive(entries, selected, defaultLane, laneOf) {
  if (!GUIDE_LANES.includes(defaultLane) || selected !== defaultLane) return [];
  return entries.filter(entry => !GUIDE_LANES.includes(laneOf(entry)));
}

export const mordekaiserBaronPlan = [
  ["Линия", "Встань сбоку от волны: Q наносит больше урона, если задевает только чемпиона. Если соперник прячется в миньонах, не трать E только ради одного удара."],
  ["Размен", "После попадания E свяжи Q и автоатаку, чтобы включить ауру. Не превращай W в лечение во время ответного урона: сначала используй щит."],
  ["Драка", "Ультуй во врага, с которым можешь драться один на один, или убери из общей драки того, кто мешает твоей команде. Не уводи танка просто потому, что он ближе."],
];
