export type AssistantStatRow = {
  slug: string;
  name: string;
  winRate: number | null;
  pickRate: number | null;
  banRate: number | null;
  winRateTrend?: Array<number | null>;
  pickRateTrend?: Array<number | null>;
  banRateTrend?: Array<number | null>;
};

export type ChampionRecommendation = Omit<
  AssistantStatRow,
  "winRate" | "pickRate" | "banRate"
> & {
  winRate: number;
  pickRate: number;
  banRate: number;
  baseScore: number;
  trendScore: number;
  trendDirection: NewChampionTrend;
  observedTrendPoints: number;
  winRateChange: number | null;
  pickRateChange: number | null;
  banRateChange: number | null;
  powerScore: number;
  availabilityPenalty: number;
  score: number;
  winPercentile: number;
  pickPercentile: number;
  banPercentile: number;
};

export type NewChampionTrend = "up" | "down" | "flat" | "pending";

export type NewChampionInsight = ChampionRecommendation & {
  trend: NewChampionTrend;
  observedPoints: number;
};

function metricPercentile(value: number, values: number[]) {
  if (values.length < 2) return 0.5;
  const below = values.filter((candidate) => candidate < value).length;
  const equal = values.filter((candidate) => candidate === value).length;
  return (below + Math.max(0, equal - 1) / 2) / (values.length - 1);
}

const METRIC_WEIGHTS = { winRate: 2, pickRate: 1, banRate: 1.5 } as const;
const TOTAL_METRIC_WEIGHT = 4.5;

function numericPoints(values: Array<number | null> | undefined) {
  return (values || []).filter((value): value is number => Number.isFinite(value));
}

function trendChange(values: Array<number | null> | undefined) {
  const points = numericPoints(values).slice(-7);
  return points.length >= 2 ? points[points.length - 1] - points[0] : null;
}

/**
 * Rates champions relative to the currently selected rank/lane slice.
 * Position in the rendered table and Riot's strengthLevel are deliberately ignored.
 */
export function analyzeChampionRecommendations(rows: AssistantStatRow[]) {
  const completeRows = rows.filter(
    (row): row is AssistantStatRow & {
      winRate: number;
      pickRate: number;
      banRate: number;
    } =>
      Number.isFinite(row.winRate) &&
      Number.isFinite(row.pickRate) &&
      Number.isFinite(row.banRate),
  );

  const winRates = completeRows.map((row) => row.winRate);
  const pickRates = completeRows.map((row) => row.pickRate);
  const banRates = completeRows.map((row) => row.banRate);
  const changes = completeRows.map((row) => ({
    winRate: trendChange(row.winRateTrend),
    pickRate: trendChange(row.pickRateTrend),
    banRate: trendChange(row.banRateTrend),
  }));
  const trendValues = {
    winRate: changes.flatMap((change) => change.winRate == null ? [] : [change.winRate]),
    pickRate: changes.flatMap((change) => change.pickRate == null ? [] : [change.pickRate]),
    banRate: changes.flatMap((change) => change.banRate == null ? [] : [change.banRate]),
  };

  const rated: ChampionRecommendation[] = completeRows.map((row, index) => {
    const winPercentile = metricPercentile(row.winRate, winRates);
    const pickPercentile = metricPercentile(row.pickRate, pickRates);
    const banPercentile = metricPercentile(row.banRate, banRates);
    const baseScore =
      (winPercentile * METRIC_WEIGHTS.winRate +
        pickPercentile * METRIC_WEIGHTS.pickRate +
        banPercentile * METRIC_WEIGHTS.banRate) /
      TOTAL_METRIC_WEIGHT;
    const change = changes[index];
    const observedTrendPoints = Math.max(
      numericPoints(row.winRateTrend).slice(-7).length,
      numericPoints(row.pickRateTrend).slice(-7).length,
      numericPoints(row.banRateTrend).slice(-7).length,
    );
    const hasTrend = observedTrendPoints >= 2;
    const trendScore = hasTrend
      ? ((change.winRate == null ? 0.5 : metricPercentile(change.winRate, trendValues.winRate)) * METRIC_WEIGHTS.winRate +
          (change.pickRate == null ? 0.5 : metricPercentile(change.pickRate, trendValues.pickRate)) * METRIC_WEIGHTS.pickRate +
          (change.banRate == null ? 0.5 : metricPercentile(change.banRate, trendValues.banRate)) * METRIC_WEIGHTS.banRate) /
        TOTAL_METRIC_WEIGHT
      : 0.5;
    const trendDirection: NewChampionTrend = !hasTrend
      ? "pending"
      : trendScore >= 0.58
        ? "up"
        : trendScore <= 0.42
          ? "down"
          : "flat";
    // The seven-day trend can adjust the current weighted strength by up to ±10 points.
    const powerScore = Math.min(
      1,
      Math.max(0, baseScore + (trendScore - 0.5) * 0.2),
    );
    // A high ban rate signals strength, but also reduces practical availability.
    const availabilityPenalty =
      Math.min(1, Math.max(0, (row.banRate - 10) / 35)) * 0.15;
    const score = Math.max(0, powerScore - availabilityPenalty);
    return {
      ...row,
      baseScore: Math.round(baseScore * 1000) / 1000,
      trendScore: Math.round(trendScore * 1000) / 1000,
      trendDirection,
      observedTrendPoints,
      winRateChange: change.winRate,
      pickRateChange: change.pickRate,
      banRateChange: change.banRate,
      powerScore: Math.round(powerScore * 1000) / 1000,
      availabilityPenalty: Math.round(availabilityPenalty * 1000) / 1000,
      score: Math.round(score * 1000) / 1000,
      winPercentile,
      pickPercentile,
      banPercentile,
    };
  });

  const ranked = rated.sort((left, right) => right.score - left.score);
  const recommended = ranked.slice(0, 3);
  const avoid = ranked.length > 3 ? ranked.slice(-2).reverse() : [];

  return { recommended, avoid, rated: ranked };
}

type RowWithTrends = AssistantStatRow & {
  positionTrend?: Array<number | null>;
  winRateTrend?: Array<number | null>;
  pickRateTrend?: Array<number | null>;
  banRateTrend?: Array<number | null>;
};

export function findNewChampionInsights(rows: RowWithTrends[]) {
  const { rated } = analyzeChampionRecommendations(rows);
  const ratedBySlug = new Map(rated.map((row) => [row.slug, row]));

  return rows.flatMap((row): NewChampionInsight[] => {
    const trends = [
      row.positionTrend,
      row.winRateTrend,
      row.pickRateTrend,
      row.banRateTrend,
    ];
    const longestHistory = Math.max(0, ...trends.map((trend) => trend?.length || 0));
    const pointSets = trends.map(numericPoints);
    const observedPoints = Math.max(0, ...pointSets.map((points) => points.length));
    const appearedLate = trends.some(
      (trend) =>
        (trend?.length || 0) >= 3 &&
        trend!.slice(0, -Math.max(1, observedPoints)).some((value) => value == null),
    );
    const rating = ratedBySlug.get(row.slug);

    if (!rating || longestHistory < 3 || !appearedLate || observedPoints > 3) {
      return [];
    }

    const movements = pointSets.flatMap((points, index) => {
      if (points.length < 2) return [];
      const first = points[0];
      const last = points[points.length - 1];
      // A lower table position is an improvement; higher rates are growth.
      const movement = index === 0 ? first - last : last - first;
      return Math.abs(movement) < 0.5 ? [0] : [Math.sign(movement)];
    });
    const directionScore = movements.reduce((sum, movement) => sum + movement, 0);
    const trend: NewChampionTrend =
      observedPoints < 2
        ? "pending"
        : directionScore > 0
          ? "up"
          : directionScore < 0
            ? "down"
            : "flat";

    return [{ ...rating, trend, observedPoints }];
  });
}
