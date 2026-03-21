const DEFAULT_STATS_API_ORIGIN = "http://127.0.0.1:3001";

export function getStatsApiBaseUrl() {
  const raw =
    process.env.API_PROXY_TARGET ||
    process.env.NEXT_PUBLIC_STATS_API_ORIGIN ||
    process.env.STATS_API_ORIGIN ||
    process.env.NEXT_PUBLIC_API_ORIGIN ||
    process.env.API_ORIGIN ||
    DEFAULT_STATS_API_ORIGIN;

  return String(raw).replace(/\/+$/, "");
}

export async function fetchGuideFromApi<T>(slug: string): Promise<T | null> {
  try {
    const baseUrl = getStatsApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/guides/${encodeURIComponent(slug)}?lang=ru_ru`, {
      next: { revalidate: 3600 * 24 * 7 },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error("guide api fetch error", error);
    return null;
  }
}

export async function fetchGuideSlugsFromApi(): Promise<string[]> {
  try {
    const baseUrl = getStatsApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/guides?fields=slug`, {
      next: { revalidate: 3600 * 24 * 7 },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = (await response.json()) as
      | string[]
      | { items?: Array<{ slug?: string | null }> };

    if (Array.isArray(payload)) {
      return payload.filter(Boolean);
    }

    return (payload.items || [])
      .map((item) => String(item?.slug || "").trim())
      .filter(Boolean);
  } catch (error) {
    console.error("guide slugs api fetch error", error);
    return [];
  }
}

export type GuideSummary = {
  slug: string;
  name: string;
  title?: string | null;
  iconUrl?: string | null;
  patch?: string | null;
  tier?: string | null;
  recommendedRole?: string | null;
  roles: string[];
  buildCount: number;
  updatedAt?: string | null;
};

export async function fetchGuideSummariesFromApi(): Promise<GuideSummary[]> {
  try {
    const baseUrl = getStatsApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/guides`, {
      next: { revalidate: 3600 * 24 * 7 },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = (await response.json()) as { items?: GuideSummary[] };
    return Array.isArray(payload?.items) ? payload.items : [];
  } catch (error) {
    console.error("guide summaries api fetch error", error);
    return [];
  }
}

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

export function toLaneKey(value?: string | null): LaneKey | null {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized.includes("support") || normalized.includes("саппорт")) return "support";
  if (normalized.includes("mid") || normalized.includes("мид")) return "mid";
  if (normalized.includes("jungle") || normalized.includes("лес")) return "jungle";
  if (normalized.includes("baron") || normalized.includes("топ")) return "top";
  if (normalized.includes("duo") || normalized.includes("adc") || normalized.includes("адк")) {
    return "adc";
  }

  return null;
}

export async function fetchTierlistBulk(): Promise<BulkResponse | null> {
  try {
    const baseUrl = getStatsApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/tierlist-bulk?lang=ru_ru`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as BulkResponse;
  } catch (error) {
    console.error("guide tierlist-bulk error", error);
    return null;
  }
}

export function findTierLabelForChampion(
  bulk: BulkResponse | null,
  championSlug: string,
  laneKey: LaneKey | null,
  rankKey: RankKey = "diamondPlus",
) {
  if (!bulk || !laneKey) return null;

  const bucket = bulk.tiersByRankLane?.[`${rankKey}|${laneKey}`];
  if (!bucket?.tiers) return null;

  for (const [tierLabel, champions] of Object.entries(bucket.tiers)) {
    if (champions.some((champion) => champion.slug === championSlug)) {
      return tierLabel;
    }
  }

  return null;
}
