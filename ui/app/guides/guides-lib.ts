import {
  buildChampionLaneMap as buildChampionLaneMapShared,
  fetchChampionIndexFromApi as fetchChampionIndexFromApiShared,
  fetchChampionNamesFromApi as fetchChampionNamesFromApiShared,
  GuideApiRequestError,
  fetchGuideFromApi as fetchGuideFromApiShared,
  fetchGuideSlugsFromApi as fetchGuideSlugsFromApiShared,
  fetchGuideSummariesFromApi as fetchGuideSummariesFromApiShared,
  fetchTierlistBulk as fetchTierlistBulkShared,
  findTierLabelForChampion as findTierLabelForChampionShared,
  getStatsApiBaseUrl,
  hydrateGuideIndexItems as hydrateGuideIndexItemsShared,
  toLaneKey as toLaneKeyShared,
} from "./guides-lib.shared.js";

export { getStatsApiBaseUrl };
export { GuideApiRequestError };

export type GuideSummary = {
  slug: string;
  name: string;
  localizedName?: string | null;
  hasGuide?: boolean;
  title?: string | null;
  iconUrl?: string | null;
  patch?: string | null;
  tier?: string | null;
  recommendedRole?: string | null;
  roles: string[];
  availableLanes?: LaneKey[];
  buildCount: number;
  updatedAt?: string | null;
};

export type ChampionIndexItem = {
  slug: string;
  name: string | null;
  roles: string[];
  iconUrl?: string | null;
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

export async function fetchChampionIndexFromApi(): Promise<ChampionIndexItem[]> {
  return (await fetchChampionIndexFromApiShared()) as ChampionIndexItem[];
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

export function buildChampionLaneMap(bulk: BulkResponse | null) {
  return (
    buildChampionLaneMapShared as (bulk: BulkResponse | null) => Map<string, Set<LaneKey>>
  )(bulk);
}

export function hydrateGuideIndexItems(
  guideItems: GuideSummary[],
  championIndex: ChampionIndexItem[],
  tierlistBulk: BulkResponse | null,
) {
  return (
    hydrateGuideIndexItemsShared as (
      guideItems: GuideSummary[],
      championIndex: ChampionIndexItem[],
      tierlistBulk: BulkResponse | null,
    ) => Array<
      GuideSummary & {
        laneKeys: LaneKey[];
        hasGuide: boolean;
        localizedName: string | null;
      }
    >
  )(guideItems, championIndex, tierlistBulk);
}

export function findTierLabelForChampion(
  bulk: BulkResponse | null,
  championSlug: string,
  laneKey: LaneKey | null,
  rankKey: RankKey = "diamondPlus",
) {
  return findTierLabelForChampionShared(bulk, championSlug, laneKey, rankKey);
}
