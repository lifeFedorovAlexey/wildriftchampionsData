export function pickCurrentTiers(data, rankKey, laneKey) {
  if (!data?.tiersByRankLane) return null;
  return data.tiersByRankLane[`${rankKey}|${laneKey}`]?.tiers ?? null;
}
