/**
 * @typedef {{
 *   slug: string;
 *   name?: string | null;
 *   icon?: string | null;
 * }} Champion
 */

/**
 * @typedef {{
 *   date: string;
 *   slug: string;
 *   rank: string;
 *   lane: string;
 *   winRate?: number | null;
 *   pickRate?: number | null;
 *   banRate?: number | null;
 *   strengthLevel?: number | null;
 * }} HistoryItem
 */

/**
 * @typedef {"winRate" | "pickRate" | "banRate" | "strengthLevel"} SortColumn
 */

/**
 * @typedef {{
 *   column: SortColumn | null;
 *   dir: "asc" | "desc" | null;
 * }} SortState
 */

const DEFAULT_STATS_API_ORIGIN = "http://127.0.0.1:3001";
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

export function fetchJson(url, nextOptions) {
  return fetch(url, nextOptions).then(async (res) => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }

    return res.json();
  });
}

export function buildLatestMap(items) {
  /** @type {Record<string, string>} */
  const latestDateBySlice = {};

  for (const item of items) {
    if (!item?.rank || !item?.lane || !item?.date) continue;

    const sliceKey = `${item.rank}|${item.lane}`;
    const prevDate = latestDateBySlice[sliceKey];

    if (!prevDate || String(item.date) > String(prevDate)) {
      latestDateBySlice[sliceKey] = String(item.date);
    }
  }

  /** @type {Record<string, HistoryItem>} */
  const latestMap = {};

  for (const item of items) {
    if (!item?.slug || !item?.rank || !item?.lane || !item?.date) continue;

    const sliceKey = `${item.rank}|${item.lane}`;
    const latestDate = latestDateBySlice[sliceKey];

    if (!latestDate || String(item.date) !== String(latestDate)) continue;

    latestMap[`${item.slug}|${item.rank}|${item.lane}`] = item;
  }

  return latestMap;
}

export function getStatsApiBaseUrl(env = process.env) {
  const raw =
    env.NEXT_PUBLIC_STATS_API_ORIGIN ||
    env.STATS_API_ORIGIN ||
    env.NEXT_PUBLIC_API_ORIGIN ||
    env.API_ORIGIN ||
    DEFAULT_STATS_API_ORIGIN;

  return String(raw).replace(/\/+$/, "");
}

export function buildStatsUrls(language, env = process.env) {
  const baseUrl = getStatsApiBaseUrl(env);

  return {
    championsUrl: `${baseUrl}/api/champions?lang=${encodeURIComponent(language)}`,
    historyUrl: `${baseUrl}/api/winrates-snapshot`,
    updatedAtUrl: `${baseUrl}/api/updated-at`,
  };
}

export function normalizeIconSrc(src) {
  if (!src) return null;
  if (src.startsWith("/")) return src;

  try {
    const url = new URL(src);
    const apiPathIndex = url.pathname.indexOf("/wr-api/");

    if (apiPathIndex !== -1) {
      return url.pathname.slice(apiPathIndex) + (url.search || "");
    }

    return src;
  } catch {
    return src;
  }
}

export function strengthToTier(level) {
  if (level == null) return { label: "—", color: "#94a3b8" };

  switch (level) {
    case 0:
      return { label: "S+", color: "#fb7185" };
    case 1:
      return { label: "S", color: "#f97316" };
    case 2:
      return { label: "A", color: "#facc15" };
    case 3:
      return { label: "B", color: "#4ade80" };
    case 4:
      return { label: "C", color: "#7dd3fc" };
    default:
      return { label: "D", color: "#94a3b8" };
  }
}

export function nextSortState(current, column) {
  if (current.column !== column) {
    return { column, dir: "desc" };
  }

  if (current.dir === "desc") {
    return { column, dir: "asc" };
  }

  return { column: null, dir: null };
}

function compareRows(left, right, sort) {
  if (!sort?.column || !sort?.dir) {
    return (right.winRate || 0) - (left.winRate || 0);
  }

  if (sort.column === "strengthLevel") {
    const leftValue = left.strengthLevel ?? 999;
    const rightValue = right.strengthLevel ?? 999;

    return sort.dir === "desc"
      ? leftValue - rightValue
      : rightValue - leftValue;
  }

  const leftValue = left[sort.column] ?? 0;
  const rightValue = right[sort.column] ?? 0;

  return sort.dir === "desc"
    ? rightValue - leftValue
    : leftValue - rightValue;
}

function toSliceRows(champions, statsMap, rankKey, laneKey) {
  return champions
    .map((champion) => {
      if (!champion?.slug) return null;

      const stat = statsMap[`${champion.slug}|${rankKey}|${laneKey}`];
      if (!stat) return null;

      const tier = strengthToTier(stat.strengthLevel ?? null);
      const name =
        typeof champion.name === "string" && champion.name.trim()
          ? champion.name
          : champion.slug;

      return {
        slug: champion.slug,
        name,
        icon: champion.icon || null,
        winRate: stat.winRate ?? null,
        pickRate: stat.pickRate ?? null,
        banRate: stat.banRate ?? null,
        strengthLevel: stat.strengthLevel ?? null,
        tierLabel: tier.label,
        tierColor: tier.color,
      };
    })
    .filter(Boolean);
}

function findNearestWeeklyDate(items, rankKey, laneKey) {
  const sliceItems = items.filter(
    (item) => item?.rank === rankKey && item?.lane === laneKey && item?.date,
  );

  if (!sliceItems.length) {
    return { currentDate: null, previousDate: null };
  }

  const uniqueDates = [...new Set(sliceItems.map((item) => String(item.date)))].sort();
  const currentDate = uniqueDates[uniqueDates.length - 1] ?? null;

  if (!currentDate) {
    return { currentDate: null, previousDate: null };
  }

  const currentTs = new Date(currentDate).getTime();
  if (Number.isNaN(currentTs)) {
    return { currentDate, previousDate: null };
  }

  const targetTs = currentTs - WEEK_IN_MS;
  let previousDate = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const date of uniqueDates) {
    if (date === currentDate) continue;

    const ts = new Date(date).getTime();
    if (Number.isNaN(ts)) continue;

    const distance = Math.abs(ts - targetTs);
    if (distance < bestDistance) {
      bestDistance = distance;
      previousDate = date;
    }
  }

  return { currentDate, previousDate };
}

function buildMapForDate(items, rankKey, laneKey, targetDate) {
  /** @type {Record<string, HistoryItem>} */
  const map = {};

  if (!targetDate) return map;

  for (const item of items) {
    if (!item?.slug) continue;
    if (item.rank !== rankKey || item.lane !== laneKey) continue;
    if (String(item.date) !== String(targetDate)) continue;

    map[`${item.slug}|${item.rank}|${item.lane}`] = item;
  }

  return map;
}

function buildPositionDeltaMap({
  champions,
  historyItems,
  rankKey,
  laneKey,
  sort,
}) {
  if (!Array.isArray(historyItems) || !historyItems.length) {
    return {};
  }

  const { currentDate, previousDate } = findNearestWeeklyDate(
    historyItems,
    rankKey,
    laneKey,
  );

  if (!currentDate || !previousDate) {
    return {};
  }

  const currentRows = toSliceRows(
    champions,
    buildMapForDate(historyItems, rankKey, laneKey, currentDate),
    rankKey,
    laneKey,
  ).sort((left, right) => compareRows(left, right, sort));

  const previousRows = toSliceRows(
    champions,
    buildMapForDate(historyItems, rankKey, laneKey, previousDate),
    rankKey,
    laneKey,
  ).sort((left, right) => compareRows(left, right, sort));

  /** @type {Record<string, number>} */
  const previousPositionBySlug = {};
  previousRows.forEach((row, index) => {
    previousPositionBySlug[row.slug] = index + 1;
  });

  /** @type {Record<string, number | null>} */
  const deltaMap = {};
  currentRows.forEach((row, index) => {
    const currentPosition = index + 1;
    const previousPosition = previousPositionBySlug[row.slug];
    deltaMap[row.slug] =
      typeof previousPosition === "number"
        ? previousPosition - currentPosition
        : null;
  });

  return deltaMap;
}

function buildPositionTrendMap({
  champions,
  historyItems,
  rankKey,
  laneKey,
  sort,
}) {
  if (!Array.isArray(historyItems) || !historyItems.length) {
    return {};
  }

  const sliceItems = historyItems.filter(
    (item) => item?.rank === rankKey && item?.lane === laneKey && item?.date,
  );

  if (!sliceItems.length) {
    return {};
  }

  const recentDates = [...new Set(sliceItems.map((item) => String(item.date)))]
    .sort()
    .slice(-7);

  /** @type {Record<string, Array<number | null>>} */
  const trendMap = {};

  for (const champion of champions) {
    if (!champion?.slug) continue;
    trendMap[champion.slug] = recentDates.map(() => null);
  }

  recentDates.forEach((date, dateIndex) => {
    const rowsForDate = toSliceRows(
      champions,
      buildMapForDate(historyItems, rankKey, laneKey, date),
      rankKey,
      laneKey,
    ).sort((left, right) => compareRows(left, right, sort));

    rowsForDate.forEach((row, rowIndex) => {
      if (!trendMap[row.slug]) {
        trendMap[row.slug] = recentDates.map(() => null);
      }

      trendMap[row.slug][dateIndex] = rowIndex + 1;
    });
  });

  return trendMap;
}

/**
 * @param {{
 *   champions: Champion[];
 *   latestStats: Record<string, HistoryItem> | null;
 *   historyItems?: HistoryItem[];
 *   rankKey: string;
 *   laneKey: string;
 *   sort: SortState;
 * }} params
 */
export function buildWinrateRows({
  champions,
  latestStats,
  historyItems = [],
  rankKey,
  laneKey,
  sort,
}) {
  if (!Array.isArray(champions) || !champions.length || !latestStats) {
    return [];
  }

  const positionDeltaMap = buildPositionDeltaMap({
    champions,
    historyItems,
    rankKey,
    laneKey,
    sort,
  });
  const positionTrendMap = buildPositionTrendMap({
    champions,
    historyItems,
    rankKey,
    laneKey,
    sort,
  });

  const rows = toSliceRows(champions, latestStats, rankKey, laneKey).map((row) => ({
    ...row,
    positionDelta:
      Object.prototype.hasOwnProperty.call(positionDeltaMap, row.slug)
        ? positionDeltaMap[row.slug]
        : null,
    positionTrend:
      Object.prototype.hasOwnProperty.call(positionTrendMap, row.slug)
        ? positionTrendMap[row.slug]
        : [],
  }));

  return rows.sort((left, right) => compareRows(left, right, sort));
}
