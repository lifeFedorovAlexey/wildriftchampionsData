export function toNum(v, fallback = 0) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function buildLinearTrend(points, yKey, xKey = "ts") {
  const n = points.length;
  if (!n) return [];

  const xs = points.map((p, i) =>
    typeof p?.[xKey] === "number" ? p[xKey] : i
  );
  const ys = points.map((p) => toNum(p?.[yKey], 0));

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
    sumXY += xs[i] * ys[i];
    sumXX += xs[i] * xs[i];
  }

  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-12) {
    const avg = sumY / n;
    return points.map(() => Number(avg.toFixed(4)));
  }

  const a = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - a * sumX) / n;

  return points.map((_, i) => Number((a * xs[i] + b).toFixed(4)));
}

export function mapChampionOptions(items) {
  return (items || []).map((champion) => ({
    slug: champion.slug,
    displayName: champion.name || champion.slug,
  }));
}

export function buildTrendDays(rawHistory, range) {
  const mapped = (rawHistory || [])
    .map((item) => {
      const date = new Date(item.date);
      return {
        fullDate: item.date,
        date: date.toLocaleDateString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
        }),
        ts: date.getTime(),
        winRate: toNum(item.winRate),
        pickRate: toNum(item.pickRate),
        banRate: toNum(item.banRate),
      };
    })
    .sort((left, right) => left.ts - right.ts);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const daysCount = range === "month" ? 31 : 7;
  const cutoff =
    range === "all" ? 0 : todayStart.getTime() - (daysCount - 1) * 864e5;

  const filtered = mapped.filter((day) => day.ts >= cutoff);

  const winTrend = buildLinearTrend(filtered, "winRate");
  const pickTrend = buildLinearTrend(filtered, "pickRate");
  const banTrend = buildLinearTrend(filtered, "banRate");

  return filtered.map((day, index) => ({
    ...day,
    winTrend: winTrend[index],
    pickTrend: pickTrend[index],
    banTrend: banTrend[index],
  }));
}
