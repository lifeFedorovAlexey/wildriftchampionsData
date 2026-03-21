const EXCLUDED_RANK_KEYS = new Set(["overall"]);
const LOW_ELO_RANKS = new Set(["diamondPlus", "masterPlus"]);
const HIGH_ELO_RANKS = new Set(["king", "peak"]);

export { EXCLUDED_RANK_KEYS, LOW_ELO_RANKS, HIGH_ELO_RANKS };

export function aggregateLatestPicksBans({
  latestItems,
  champions,
  rankRange,
}) {
  if (!Array.isArray(latestItems) || latestItems.length === 0) return [];

  const champBySlug = {};
  for (const ch of champions || []) {
    if (ch?.slug) champBySlug[ch.slug] = ch;
  }

  const aggBySlug = new Map();

  for (const item of latestItems) {
    const slug = item?.slug;
    const rankKey = item?.rank;
    const laneKey = item?.lane;

    if (!slug || !rankKey || !laneKey) continue;
    if (EXCLUDED_RANK_KEYS.has(rankKey)) continue;
    if (rankRange === "low" && !LOW_ELO_RANKS.has(rankKey)) continue;
    if (rankRange === "high" && !HIGH_ELO_RANKS.has(rankKey)) continue;

    const pickRate = item.pickRate ?? 0;
    const banRate = item.banRate ?? 0;

    if (!aggBySlug.has(slug)) {
      const champion = champBySlug[slug];
      const displayName =
        champion?.name && typeof champion.name === "string"
          ? champion.name
          : slug;

      aggBySlug.set(slug, {
        slug,
        name: displayName,
        totalPickRate: 0,
        totalBanRate: 0,
        lanes: {
          all: { pick: 0, ban: 0, pickRanks: {}, banRanks: {} },
        },
        _totalPickSum: 0,
        _totalPickCount: 0,
        _totalBanSum: 0,
        _totalBanCount: 0,
        _banRanksAdded: new Set(),
      });
    }

    const agg = aggBySlug.get(slug);
    const lanes = agg.lanes;

    if (!lanes[laneKey]) {
      lanes[laneKey] = {
        pick: 0,
        ban: 0,
        pickRanks: {},
        banRanks: {},
        _pickSum: 0,
        _pickCount: 0,
      };
    }

    agg._totalPickSum += pickRate;
    agg._totalPickCount += 1;
    lanes[laneKey]._pickSum += pickRate;
    lanes[laneKey]._pickCount += 1;
    lanes[laneKey].pickRanks[rankKey] =
      (lanes[laneKey].pickRanks[rankKey] || 0) + pickRate;

    if (!agg._banRanksAdded.has(rankKey)) {
      agg._totalBanSum += banRate;
      agg._totalBanCount += 1;
      lanes.all.banRanks[rankKey] = (lanes.all.banRanks[rankKey] || 0) + banRate;
      agg._banRanksAdded.add(rankKey);
    }
  }

  const result = [];
  for (const value of aggBySlug.values()) {
    value.totalPickRate =
      value._totalPickCount > 0 ? value._totalPickSum / value._totalPickCount : 0;
    value.totalBanRate =
      value._totalBanCount > 0 ? value._totalBanSum / value._totalBanCount : 0;

    for (const [laneKey, laneData] of Object.entries(value.lanes)) {
      if (laneKey === "all") continue;
      const c = laneData._pickCount || 0;
      const s = laneData._pickSum || 0;
      laneData.pick = c > 0 ? s / c : 0;
      delete laneData._pickSum;
      delete laneData._pickCount;
    }

    value.lanes.all.ban = value.totalBanRate;

    delete value._totalPickSum;
    delete value._totalPickCount;
    delete value._totalBanSum;
    delete value._totalBanCount;
    delete value._banRanksAdded;

    if (value.totalPickRate === 0 && value.totalBanRate === 0) continue;
    result.push(value);
  }

  return result;
}
