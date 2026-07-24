const RANK_ORDER = ["diamondPlus", "masterPlus", "king", "peak"];
const LANE_ORDER = ["top", "jungle", "mid", "adc", "support"];

function finiteOrNull(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? Number(value.toFixed(2))
    : null;
}

function metricDelta(current, previous) {
  if (current == null || previous == null) return null;
  return Number((current - previous).toFixed(2));
}

export function buildChampionTrendDays(row, dates = []) {
  if (!row || !Array.isArray(dates) || !dates.length) return [];

  const safeDates = dates.slice(-7);
  const trends = {
    winRate: Array.isArray(row.winRateTrend) ? row.winRateTrend.slice(-safeDates.length) : [],
    pickRate: Array.isArray(row.pickRateTrend) ? row.pickRateTrend.slice(-safeDates.length) : [],
    banRate: Array.isArray(row.banRateTrend) ? row.banRateTrend.slice(-safeDates.length) : [],
  };

  return safeDates.map((date, index) => {
    const isLatest = index === safeDates.length - 1;
    const winRate = finiteOrNull(isLatest ? row.winRate : trends.winRate[index]);
    const pickRate = finiteOrNull(isLatest ? row.pickRate : trends.pickRate[index]);
    const banRate = finiteOrNull(isLatest ? row.banRate : trends.banRate[index]);
    const previousWinRate = finiteOrNull(trends.winRate[index - 1]);
    const previousPickRate = finiteOrNull(trends.pickRate[index - 1]);
    const previousBanRate = finiteOrNull(trends.banRate[index - 1]);

    return {
      date,
      winRate,
      pickRate,
      banRate,
      winRateDelta: metricDelta(winRate, previousWinRate),
      pickRateDelta: metricDelta(pickRate, previousPickRate),
      banRateDelta: metricDelta(banRate, previousBanRate),
    };
  });
}

export function buildChampionMetaSlices({ slug, rowsBySlice, dates }) {
  const normalizedSlug = String(slug || "").trim().toLowerCase();
  if (!normalizedSlug) return [];

  return Object.entries(rowsBySlice || {})
    .flatMap(([sliceKey, rows]) => {
      const [rankKey, laneKey] = String(sliceKey).split("|");
      if (!RANK_ORDER.includes(rankKey) || !LANE_ORDER.includes(laneKey)) return [];
      const row = Array.isArray(rows)
        ? rows.find((item) => String(item?.slug || "").trim().toLowerCase() === normalizedSlug)
        : null;
      if (!row || ![row.winRate, row.pickRate, row.banRate].some((value) => finiteOrNull(value) != null)) {
        return [];
      }

      return [{ rankKey, laneKey, row, days: buildChampionTrendDays(row, dates) }];
    })
    .sort((left, right) => {
      const laneDelta = LANE_ORDER.indexOf(left.laneKey) - LANE_ORDER.indexOf(right.laneKey);
      return laneDelta || RANK_ORDER.indexOf(left.rankKey) - RANK_ORDER.indexOf(right.rankKey);
    });
}
