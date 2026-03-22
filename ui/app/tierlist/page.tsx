import dynamic from "next/dynamic";
import { TierlistSkeleton } from "@/components/ui/LazySkeletons";
import { getStatsApiBaseUrl } from "../../lib/stats-api-origin.js";

const TierlistClient = dynamic(() => import("./TierlistClient"), {
  loading: () => <TierlistSkeleton />,
});

export const revalidate = 60;

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
    const baseUrl = getStatsApiBaseUrl(process.env);

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
