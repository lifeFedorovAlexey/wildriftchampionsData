import {
  fetchChampionNamesFromApi as fetchChampionNamesFromApiShared,
  fetchGuideFromApi as fetchGuideFromApiShared,
  fetchGuideSlugsFromApi as fetchGuideSlugsFromApiShared,
  fetchGuideSummariesFromApi as fetchGuideSummariesFromApiShared,
  fetchTierlistBulk as fetchTierlistBulkShared,
  findTierLabelForChampion as findTierLabelForChampionShared,
  getStatsApiBaseUrl,
  toLaneKey as toLaneKeyShared,
} from "./guides-lib.shared.js";

export { getStatsApiBaseUrl };

export type GuideSummary = {
  slug: string;
  name: string;
  localizedName?: string | null;
  title?: string | null;
  iconUrl?: string | null;
  patch?: string | null;
  tier?: string | null;
  recommendedRole?: string | null;
  roles: string[];
  buildCount: number;
  updatedAt?: string | null;
};

export type RankKey = "diamondPlus" | "masterPlus" | "king" | "peak";
export type LaneKey = "top" | "jungle" | "mid" | "adc" | "support";

type TierChampion = {
  slug: string;
};

type TierBucket = {
  rank: RankKey;
  lane: LaneKey;
  tiers: Record<string, TierChampion[]>;
};

export type BulkResponse = {
  tiersByRankLane: Record<string, TierBucket>;
};

export async function fetchGuideFromApi<T>(slug: string): Promise<T | null> {
  return (await fetchGuideFromApiShared(slug)) as T | null;
}

export async function fetchGuideSlugsFromApi(): Promise<string[]> {
  return await fetchGuideSlugsFromApiShared();
}

export async function fetchChampionNamesFromApi(): Promise<Record<string, string>> {
  return (await fetchChampionNamesFromApiShared()) as Record<string, string>;
}

export async function fetchGuideSummariesFromApi(): Promise<GuideSummary[]> {
  return (await fetchGuideSummariesFromApiShared()) as GuideSummary[];
}

export function toLaneKey(value?: string | null): LaneKey | null {
  return toLaneKeyShared(value) as LaneKey | null;
}

export async function fetchTierlistBulk(): Promise<BulkResponse | null> {
  return (await fetchTierlistBulkShared()) as BulkResponse | null;
}

export function findTierLabelForChampion(
  bulk: BulkResponse | null,
  championSlug: string,
  laneKey: LaneKey | null,
  rankKey: RankKey = "diamondPlus",
) {
  return findTierLabelForChampionShared(bulk, championSlug, laneKey, rankKey);
}
