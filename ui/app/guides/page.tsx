import dynamic from "next/dynamic";
import PageWrapper from "@/components/PageWrapper";
import { GuidesContentSkeleton } from "@/components/ui/LazySkeletons";
import {
  type BulkResponse,
  type LaneKey,
  fetchChampionIndexFromApi,
  fetchGuideSummariesFromApi,
  fetchTierlistBulk,
} from "./guides-lib";

const GuidesIndexClient = dynamic(() => import("./GuidesIndexClient"), {
  loading: () => <GuidesContentSkeleton />,
});

const LANE_KEYS: readonly LaneKey[] = ["top", "jungle", "mid", "adc", "support"];

function buildChampionLaneMap(tierlistBulk: BulkResponse | null) {
  const laneMap = new Map<string, Set<LaneKey>>();

  for (const laneKey of LANE_KEYS) {
    const buckets = Object.entries(tierlistBulk?.tiersByRankLane || {})
      .filter(([sliceKey]) => sliceKey.endsWith(`|${laneKey}`))
      .map(([, bucket]) => bucket);

    for (const bucket of buckets) {
      for (const champions of Object.values(bucket?.tiers || {})) {
        for (const champion of Array.isArray(champions) ? champions : []) {
          const slug = String(champion?.slug || "").trim();
          if (!slug) continue;

          const current = laneMap.get(slug) || new Set();
          current.add(laneKey);
          laneMap.set(slug, current);
        }
      }
    }
  }

  return laneMap;
}

export default async function GuidesPage() {
  const [guideItems, championIndex, tierlistBulk] = await Promise.all([
    fetchGuideSummariesFromApi(),
    fetchChampionIndexFromApi(),
    fetchTierlistBulk(),
  ]);

  const guideItemsBySlug = new Map(guideItems.map((item) => [item.slug, item]));
  const championLaneMap = buildChampionLaneMap(tierlistBulk);
  const hydratedItems = championIndex.map((champion) => {
    const guide = guideItemsBySlug.get(champion.slug);
    const laneKeys = Array.from(championLaneMap.get(champion.slug) || []);

    if (guide) {
      return {
        ...guide,
        localizedName: champion.name || guide.name || null,
        iconUrl: champion.iconUrl || guide.iconUrl || null,
        roles: guide.roles?.length ? guide.roles : champion.roles || [],
        laneKeys,
        hasGuide: true,
      };
    }

    return {
      slug: champion.slug,
      name: champion.name || champion.slug,
      localizedName: champion.name || null,
      hasGuide: false,
      title: "Гайд скоро",
      iconUrl: champion.iconUrl || null,
      patch: null,
      tier: null,
      recommendedRole: null,
      roles: champion.roles || [],
      laneKeys,
      buildCount: 0,
      updatedAt: null,
    };
  });

  return (
    <PageWrapper
      title="Гайды по чемпионам"
      paragraphs={[
        "Каталог всех собранных гайдов. Открывай чемпиона и переходи в его полную страницу со сборками, рунами, прокачкой и матчапами.",
      ]}
    >
      <GuidesIndexClient items={hydratedItems} />
    </PageWrapper>
  );
}
