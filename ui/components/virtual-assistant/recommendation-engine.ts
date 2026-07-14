export type AssistantStatRow = {
  slug: string;
  name: string;
  winRate: number | null;
  pickRate: number | null;
  banRate: number | null;
};

export type ChampionRecommendation = AssistantStatRow & {
  powerScore: number;
  availabilityPenalty: number;
  score: number;
  winPercentile: number;
  pickPercentile: number;
  banPercentile: number;
  weakSignals: number;
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

  const rated: ChampionRecommendation[] = completeRows.map((row) => {
    const winPercentile = metricPercentile(row.winRate, winRates);
    const pickPercentile = metricPercentile(row.pickRate, pickRates);
    const banPercentile = metricPercentile(row.banRate, banRates);
    // Ban rate is a strength signal, but very high bans make the pick unreliable
    // in practice: after 10% BR the availability penalty gradually outweighs it.
    const powerScore =
      winPercentile * 0.6 + pickPercentile * 0.25 + banPercentile * 0.15;
    const availabilityPenalty =
      Math.min(1, Math.max(0, (row.banRate - 10) / 35)) * 0.25;
    const score = powerScore - availabilityPenalty;
    const weakSignals = [winPercentile, pickPercentile, banPercentile].filter(
      (percentile) => percentile <= 0.25,
    ).length;

    return {
      ...row,
      powerScore: Math.round(powerScore * 1000) / 1000,
      availabilityPenalty: Math.round(availabilityPenalty * 1000) / 1000,
      score: Math.round(score * 1000) / 1000,
      winPercentile,
      pickPercentile,
      banPercentile,
      weakSignals,
    };
  });

  const ranked = rated.sort((left, right) => right.score - left.score);
  const recommended = ranked.slice(0, 3);
  const avoid = [...ranked]
    .reverse()
    .filter(
      (row) =>
        row.weakSignals >= 2 &&
        row.winPercentile <= 0.35 &&
        row.score <= 0.35,
    )
    .slice(0, 2);

  return { recommended, avoid, rated: ranked };
}

type RowWithTrends = AssistantStatRow & {
  positionTrend?: Array<number | null>;
  winRateTrend?: Array<number | null>;
  pickRateTrend?: Array<number | null>;
  banRateTrend?: Array<number | null>;
};

function numericPoints(values: Array<number | null> | undefined) {
  return (values || []).filter((value): value is number => Number.isFinite(value));
}

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
