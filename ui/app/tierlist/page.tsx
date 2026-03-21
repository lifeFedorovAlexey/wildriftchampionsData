import TierlistClient from "./TierlistClient";

export const revalidate = 60;

const DEFAULT_STATS_API_ORIGIN = "http://127.0.0.1:3001";

type RankKey = "diamondPlus" | "masterPlus" | "king" | "peak";
type LaneKey = "top" | "jungle" | "mid" | "adc" | "support";

type TierChampion = {
  slug: string;
  name: string;
  icon?: string | null;
  winRate?: number | null;
};

type TierBucket = {
  rank: RankKey;
  lane: LaneKey;
  tiers: Record<string, TierChampion[]>;
};

type BulkResponse = {
  filters: {
    date: string | null;
  };
  tiersOrder: string[];
  tiersByRankLane: Record<string, TierBucket>;
};

export default async function Page() {
  let data: BulkResponse | null = null;
  let error: string | null = null;

  try {
    const baseUrl = String(
      process.env.NEXT_PUBLIC_STATS_API_ORIGIN ||
        process.env.STATS_API_ORIGIN ||
        process.env.NEXT_PUBLIC_API_ORIGIN ||
        process.env.API_ORIGIN ||
        DEFAULT_STATS_API_ORIGIN,
    ).replace(/\/+$/, "");

    const response = await fetch(`${baseUrl}/api/tierlist-bulk?lang=ru_ru`, {
      next: { revalidate },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    data = (await response.json()) as BulkResponse;
  } catch (err) {
    console.error("tierlist-bulk error", err);
    error = "Не удалось загрузить тир-лист.";
  }

  return <TierlistClient data={data} error={error} />;
}
