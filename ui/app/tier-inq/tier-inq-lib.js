export function pointsWinrate(v) {
  if (v == null) return 0;
  if (v >= 55) return 6;
  if (v >= 53 && v < 55) return 5;
  if (v >= 51 && v < 53) return 4;
  if (v >= 50 && v < 51) return 3;
  if (v >= 49 && v < 50) return 2;
  if (v >= 48 && v < 49) return 1;
  return 0;
}

export function pointsBanrate(v) {
  if (v == null) return 0;
  if (v >= 50) return 6;
  if (v >= 30 && v < 50) return 5;
  if (v >= 20 && v < 30) return 4;
  if (v >= 10 && v < 20) return 3;
  if (v >= 5 && v < 10) return 2;
  if (v >= 2 && v < 5) return 1;
  return 0;
}

export function pointsPickrate(v) {
  if (v == null) return 0;
  if (v >= 20) return 6;
  if (v >= 15 && v < 20) return 5;
  if (v >= 10 && v < 15) return 4;
  if (v >= 5 && v < 10) return 3;
  if (v >= 3 && v < 5) return 2;
  if (v >= 1 && v < 3) return 1;
  return 0;
}

export function scoreToTier(score) {
  if (score >= 15) return "S+";
  if (score >= 12) return "S";
  if (score >= 10) return "A";
  if (score >= 7) return "B";
  if (score >= 3) return "C";
  if (score >= 1) return "D";
  return null;
}

export function createEmptyTierBuckets() {
  return {
    "S+": [],
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
  };
}

export function buildLatestStatsMap(items) {
  const latestMap = {};

  for (const item of items || []) {
    if (!item || !item.slug || !item.rank || !item.lane || !item.date) continue;

    const key = `${item.slug}|${item.rank}|${item.lane}`;
    const prev = latestMap[key];

    if (!prev || String(item.date) > String(prev.date)) {
      latestMap[key] = item;
    }
  }

  return latestMap;
}

export function buildTierBuckets({
  champions,
  latestStats,
  rankKey,
  laneKey,
  weights,
}) {
  const tiers = createEmptyTierBuckets();
  let date = null;

  if (!Array.isArray(champions) || !champions.length || !latestStats) {
    return { tiers, date };
  }

  const { wWin, wPick, wBan } = weights;

  for (const champ of champions) {
    const slug = champ?.slug;
    if (!slug) continue;

    const stat = latestStats[`${slug}|${rankKey}|${laneKey}`];
    if (!stat) continue;

    const name =
      typeof champ.name === "string" && champ.name.trim() ? champ.name : slug;

    const winRate = stat.winRate ?? null;
    const pickRate = stat.pickRate ?? null;
    const banRate = stat.banRate ?? null;

    const winPts = pointsWinrate(winRate);
    const pickPts = pointsPickrate(pickRate);
    const banPts = pointsBanrate(banRate);

    const totalScoreRaw = winPts * wWin + pickPts * wPick + banPts * wBan;
    const totalScore = Math.round(totalScoreRaw * 10) / 10;

    const computedTier = scoreToTier(totalScore);
    if (!computedTier) continue;

    if (stat.date != null) {
      const value = String(stat.date);
      if (!date || value > date) date = value;
    }

    tiers[computedTier].push({
      slug,
      name,
      icon: champ.icon || null,
      winRate,
      pickRate,
      banRate,
      winPts,
      pickPts,
      banPts,
      wWin,
      wPick,
      wBan,
      totalScoreRaw,
      totalScore,
      computedTier,
    });
  }

  for (const tierKey of Object.keys(tiers)) {
    tiers[tierKey].sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;

      const bw = b.winRate ?? -999;
      const aw = a.winRate ?? -999;
      if (bw !== aw) return bw - aw;

      const bp = b.pickRate ?? -999;
      const ap = a.pickRate ?? -999;
      return bp - ap;
    });
  }

  return { tiers, date };
}
