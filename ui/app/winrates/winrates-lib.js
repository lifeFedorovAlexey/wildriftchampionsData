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

import { getStatsApiBaseUrl } from "../../lib/stats-api-origin.js";
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

function getChampionName(champion) {
  if (typeof champion?.name === "string" && champion.name.trim()) {
    return champion.name;
  }

  return champion?.slug || "";
}

function groupHistoryBySlice(items) {
  /** @type {Record<string, HistoryItem[]>} */
  const sliceMap = {};

  for (const item of items) {
    if (!item?.rank || !item?.lane || !item?.date || !item?.slug) continue;

    const sliceKey = `${item.rank}|${item.lane}`;
    if (!sliceMap[sliceKey]) {
      sliceMap[sliceKey] = [];
    }

    sliceMap[sliceKey].push(item);
  }

  return sliceMap;
}

function getRecentDates(items) {
  return [...new Set(items.map((item) => String(item.date)))]
    .sort()
    .slice(-7);
}

function buildBaseRow(championBySlug, item) {
  const champion = championBySlug[item.slug];
  const tier = strengthToTier(item.strengthLevel ?? null);

  return {
    slug: item.slug,
    name: getChampionName(champion),
    icon: champion?.icon || null,
    winRate: item.winRate ?? null,
    pickRate: item.pickRate ?? null,
    banRate: item.banRate ?? null,
    strengthLevel: item.strengthLevel ?? null,
    tierLabel: tier.label,
    tierColor: tier.color,
    winRateDelta: null,
    pickRateDelta: null,
    banRateDelta: null,
    winRateTrend: [],
    pickRateTrend: [],
    banRateTrend: [],
  };
}

function buildRowsForSlice(champions, sliceItems) {
  const recentDates = getRecentDates(sliceItems);
  const latestDate = recentDates[recentDates.length - 1] ?? null;

  if (!latestDate) return [];

  /** @type {Record<string, Champion>} */
  const championBySlug = {};
  for (const champion of champions) {
    if (!champion?.slug) continue;
    championBySlug[champion.slug] = champion;
  }

  const latestBySlug = {};

  for (const item of sliceItems) {
    const itemDate = String(item.date);

    if (itemDate === latestDate) {
      latestBySlug[item.slug] = item;
    }
  }

  return Object.values(latestBySlug)
    .sort((left, right) => (left.position ?? Number.POSITIVE_INFINITY) - (right.position ?? Number.POSITIVE_INFINITY))
    .map((item) => ({
      ...buildBaseRow(championBySlug, item),
      positionDelta: null,
      positionTrend: [],
    }));
}

function buildSliceHistory(champions, sliceItems) {
  const recentDates = getRecentDates(sliceItems);
  if (!recentDates.length) return [];

  /** @type {Record<string, Champion>} */
  const championBySlug = {};
  for (const champion of champions) {
    if (!champion?.slug) continue;
    championBySlug[champion.slug] = champion;
  }

  return recentDates.map((date) => {
    const rows = sliceItems
      .filter((item) => String(item.date) === date)
      .sort(
        (left, right) =>
          (left.position ?? Number.POSITIVE_INFINITY) -
          (right.position ?? Number.POSITIVE_INFINITY),
      )
      .map((item) => buildBaseRow(championBySlug, item));

    return { date, rows };
  });
}

/**
 * @param {{
 *   champions: Champion[];
 *   historyItems?: HistoryItem[];
 * }} params
 */
export function buildPreparedWinrateSlices({ champions, historyItems = [] }) {
  if (!Array.isArray(champions) || !champions.length) {
    return { rowsBySlice: {}, sliceHistoryByKey: {}, maxRowCount: 0 };
  }

  const sliceMap = groupHistoryBySlice(historyItems);
  /** @type {Record<string, ReturnType<typeof buildRowsForSlice>>} */
  const rowsBySlice = {};
  /** @type {Record<string, ReturnType<typeof buildSliceHistory>>} */
  const sliceHistoryByKey = {};
  let maxRowCount = 0;

  for (const [sliceKey, sliceItems] of Object.entries(sliceMap)) {
    const rows = buildRowsForSlice(champions, sliceItems);
    rowsBySlice[sliceKey] = rows;
    sliceHistoryByKey[sliceKey] = buildSliceHistory(champions, sliceItems);
    if (rows.length > maxRowCount) {
      maxRowCount = rows.length;
    }
  }

  return { rowsBySlice, sliceHistoryByKey, maxRowCount };
}

export function buildStatsUrls(language, env = process.env) {
  const baseUrl = getStatsApiBaseUrl(env);

  return {
    championsUrl: `${baseUrl}/api/champions?lang=${encodeURIComponent(language)}`,
    historyUrl: `${baseUrl}/api/winrates-snapshot`,
    updatedAtUrl: `${baseUrl}/api/updated-at`,
  };
}

export function buildStatsPaths(language) {
  return {
    championsPath: `/api/champions?lang=${encodeURIComponent(language)}`,
    historyPath: "/api/winrates-snapshot",
    updatedAtPath: "/api/updated-at",
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

function compareRowsByMetric(left, right, metricKey) {
  if (metricKey === "strengthLevel") {
    const leftValue = left.strengthLevel ?? 999;
    const rightValue = right.strengthLevel ?? 999;
    return leftValue - rightValue;
  }

  const leftValue = left[metricKey] ?? 0;
  const rightValue = right[metricKey] ?? 0;
  return rightValue - leftValue;
}

export function sortPreparedRows(rows, sort) {
  if (!Array.isArray(rows) || !rows.length) return [];
  return [...rows].sort((left, right) => compareRows(left, right, sort));
}

export function applyPreparedMovement(rows, sliceHistory, sort) {
  if (!Array.isArray(rows) || !rows.length) return [];
  if (!Array.isArray(sliceHistory) || sliceHistory.length < 2) return rows;

  const orderedHistory = [...sliceHistory].sort((left, right) =>
    String(left.date).localeCompare(String(right.date)),
  );
  const previousRows = sortPreparedRows(orderedHistory[0]?.rows || [], sort);
  const currentRows = sortPreparedRows(
    orderedHistory[orderedHistory.length - 1]?.rows || [],
    sort,
  );

  /** @type {Record<string, number>} */
  const previousIndexBySlug = {};
  previousRows.forEach((row, index) => {
    previousIndexBySlug[row.slug] = index + 1;
  });

  /** @type {Record<string, number | null>} */
  const deltaBySlug = {};
  currentRows.forEach((row, index) => {
    const previousIndex = previousIndexBySlug[row.slug];
    deltaBySlug[row.slug] =
      typeof previousIndex === "number" ? previousIndex - (index + 1) : null;
  });

  const previousWinRateRows = [...(orderedHistory[0]?.rows || [])].sort(
    (left, right) => compareRowsByMetric(left, right, "winRate"),
  );
  const currentWinRateRows = [...(orderedHistory[orderedHistory.length - 1]?.rows || [])].sort(
    (left, right) => compareRowsByMetric(left, right, "winRate"),
  );
  const previousPickRateRows = [...(orderedHistory[0]?.rows || [])].sort(
    (left, right) => compareRowsByMetric(left, right, "pickRate"),
  );
  const currentPickRateRows = [...(orderedHistory[orderedHistory.length - 1]?.rows || [])].sort(
    (left, right) => compareRowsByMetric(left, right, "pickRate"),
  );
  const previousBanRateRows = [...(orderedHistory[0]?.rows || [])].sort(
    (left, right) => compareRowsByMetric(left, right, "banRate"),
  );
  const currentBanRateRows = [...(orderedHistory[orderedHistory.length - 1]?.rows || [])].sort(
    (left, right) => compareRowsByMetric(left, right, "banRate"),
  );

  /** @type {Record<string, number>} */
  const previousWinRateIndexBySlug = {};
  previousWinRateRows.forEach((row, index) => {
    previousWinRateIndexBySlug[row.slug] = index + 1;
  });

  /** @type {Record<string, number>} */
  const previousPickRateIndexBySlug = {};
  previousPickRateRows.forEach((row, index) => {
    previousPickRateIndexBySlug[row.slug] = index + 1;
  });

  /** @type {Record<string, number>} */
  const previousBanRateIndexBySlug = {};
  previousBanRateRows.forEach((row, index) => {
    previousBanRateIndexBySlug[row.slug] = index + 1;
  });

  /** @type {Record<string, number | null>} */
  const winRateDeltaBySlug = {};
  currentWinRateRows.forEach((row, index) => {
    const previousIndex = previousWinRateIndexBySlug[row.slug];
    winRateDeltaBySlug[row.slug] =
      typeof previousIndex === "number" ? previousIndex - (index + 1) : null;
  });

  /** @type {Record<string, number | null>} */
  const pickRateDeltaBySlug = {};
  currentPickRateRows.forEach((row, index) => {
    const previousIndex = previousPickRateIndexBySlug[row.slug];
    pickRateDeltaBySlug[row.slug] =
      typeof previousIndex === "number" ? previousIndex - (index + 1) : null;
  });

  /** @type {Record<string, number | null>} */
  const banRateDeltaBySlug = {};
  currentBanRateRows.forEach((row, index) => {
    const previousIndex = previousBanRateIndexBySlug[row.slug];
    banRateDeltaBySlug[row.slug] =
      typeof previousIndex === "number" ? previousIndex - (index + 1) : null;
  });

  /** @type {Record<string, Array<number | null>>} */
  const trendBySlug = {};
  /** @type {Record<string, Array<number | null>>} */
  const winRateTrendBySlug = {};
  /** @type {Record<string, Array<number | null>>} */
  const pickRateTrendBySlug = {};
  /** @type {Record<string, Array<number | null>>} */
  const banRateTrendBySlug = {};
  orderedHistory.forEach((entry, dateIndex) => {
    const sortedRows = sortPreparedRows(entry.rows || [], sort);
    const winRateRows = [...(entry.rows || [])].sort((left, right) =>
      compareRowsByMetric(left, right, "winRate"),
    );
    const pickRateRows = [...(entry.rows || [])].sort((left, right) =>
      compareRowsByMetric(left, right, "pickRate"),
    );
    const banRateRows = [...(entry.rows || [])].sort((left, right) =>
      compareRowsByMetric(left, right, "banRate"),
    );

    sortedRows.forEach((row, rowIndex) => {
      if (!trendBySlug[row.slug]) {
        trendBySlug[row.slug] = orderedHistory.map(() => null);
      }

      trendBySlug[row.slug][dateIndex] = rowIndex + 1;
    });

    winRateRows.forEach((row, rowIndex) => {
      if (!winRateTrendBySlug[row.slug]) {
        winRateTrendBySlug[row.slug] = orderedHistory.map(() => null);
      }

      winRateTrendBySlug[row.slug][dateIndex] = rowIndex + 1;
    });

    pickRateRows.forEach((row, rowIndex) => {
      if (!pickRateTrendBySlug[row.slug]) {
        pickRateTrendBySlug[row.slug] = orderedHistory.map(() => null);
      }

      pickRateTrendBySlug[row.slug][dateIndex] = rowIndex + 1;
    });

    banRateRows.forEach((row, rowIndex) => {
      if (!banRateTrendBySlug[row.slug]) {
        banRateTrendBySlug[row.slug] = orderedHistory.map(() => null);
      }

      banRateTrendBySlug[row.slug][dateIndex] = rowIndex + 1;
    });
  });

  return rows.map((row) => ({
    ...row,
    positionDelta:
      Object.prototype.hasOwnProperty.call(deltaBySlug, row.slug)
        ? deltaBySlug[row.slug]
        : null,
    positionTrend:
      Object.prototype.hasOwnProperty.call(trendBySlug, row.slug)
        ? trendBySlug[row.slug]
        : [],
    winRateTrend:
      Object.prototype.hasOwnProperty.call(winRateTrendBySlug, row.slug)
        ? winRateTrendBySlug[row.slug]
        : [],
    winRateDelta:
      Object.prototype.hasOwnProperty.call(winRateDeltaBySlug, row.slug)
        ? winRateDeltaBySlug[row.slug]
        : null,
    pickRateTrend:
      Object.prototype.hasOwnProperty.call(pickRateTrendBySlug, row.slug)
        ? pickRateTrendBySlug[row.slug]
        : [],
    pickRateDelta:
      Object.prototype.hasOwnProperty.call(pickRateDeltaBySlug, row.slug)
        ? pickRateDeltaBySlug[row.slug]
        : null,
    banRateTrend:
      Object.prototype.hasOwnProperty.call(banRateTrendBySlug, row.slug)
        ? banRateTrendBySlug[row.slug]
        : [],
    banRateDelta:
      Object.prototype.hasOwnProperty.call(banRateDeltaBySlug, row.slug)
        ? banRateDeltaBySlug[row.slug]
        : null,
  }));
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

function buildMetricTrendMap({
  champions,
  historyItems,
  rankKey,
  laneKey,
  metricKey,
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
    ).sort((left, right) => compareRowsByMetric(left, right, metricKey));

    rowsForDate.forEach((row, rowIndex) => {
      if (!trendMap[row.slug]) {
        trendMap[row.slug] = recentDates.map(() => null);
      }

      trendMap[row.slug][dateIndex] = rowIndex + 1;
    });
  });

  return trendMap;
}

function buildMetricDeltaMap({
  champions,
  historyItems,
  rankKey,
  laneKey,
  metricKey,
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
  ).sort((left, right) => compareRowsByMetric(left, right, metricKey));

  const previousRows = toSliceRows(
    champions,
    buildMapForDate(historyItems, rankKey, laneKey, previousDate),
    rankKey,
    laneKey,
  ).sort((left, right) => compareRowsByMetric(left, right, metricKey));

  /** @type {Record<string, number>} */
  const previousIndexBySlug = {};
  previousRows.forEach((row, index) => {
    previousIndexBySlug[row.slug] = index + 1;
  });

  /** @type {Record<string, number | null>} */
  const deltaMap = {};
  currentRows.forEach((row, index) => {
    const previousIndex = previousIndexBySlug[row.slug];
    deltaMap[row.slug] =
      typeof previousIndex === "number" ? previousIndex - (index + 1) : null;
  });

  return deltaMap;
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
  const winRateTrendMap = buildMetricTrendMap({
    champions,
    historyItems,
    rankKey,
    laneKey,
    metricKey: "winRate",
  });
  const pickRateTrendMap = buildMetricTrendMap({
    champions,
    historyItems,
    rankKey,
    laneKey,
    metricKey: "pickRate",
  });
  const banRateTrendMap = buildMetricTrendMap({
    champions,
    historyItems,
    rankKey,
    laneKey,
    metricKey: "banRate",
  });
  const winRateDeltaMap = buildMetricDeltaMap({
    champions,
    historyItems,
    rankKey,
    laneKey,
    metricKey: "winRate",
  });
  const pickRateDeltaMap = buildMetricDeltaMap({
    champions,
    historyItems,
    rankKey,
    laneKey,
    metricKey: "pickRate",
  });
  const banRateDeltaMap = buildMetricDeltaMap({
    champions,
    historyItems,
    rankKey,
    laneKey,
    metricKey: "banRate",
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
    winRateTrend:
      Object.prototype.hasOwnProperty.call(winRateTrendMap, row.slug)
        ? winRateTrendMap[row.slug]
        : [],
    pickRateTrend:
      Object.prototype.hasOwnProperty.call(pickRateTrendMap, row.slug)
        ? pickRateTrendMap[row.slug]
        : [],
    banRateTrend:
      Object.prototype.hasOwnProperty.call(banRateTrendMap, row.slug)
        ? banRateTrendMap[row.slug]
        : [],
    winRateDelta:
      Object.prototype.hasOwnProperty.call(winRateDeltaMap, row.slug)
        ? winRateDeltaMap[row.slug]
        : null,
    pickRateDelta:
      Object.prototype.hasOwnProperty.call(pickRateDeltaMap, row.slug)
        ? pickRateDeltaMap[row.slug]
        : null,
    banRateDelta:
      Object.prototype.hasOwnProperty.call(banRateDeltaMap, row.slug)
        ? banRateDeltaMap[row.slug]
        : null,
  }));

  return rows.sort((left, right) => compareRows(left, right, sort));
}
