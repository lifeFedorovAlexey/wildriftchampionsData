import dynamic from "next/dynamic";
import PageWrapper from "@/components/PageWrapper";
import { GuidesContentSkeleton } from "@/components/ui/LazySkeletons";
import {
  fetchChampionIndexFromApi,
  fetchGuideSummariesFromApi,
} from "./guides-lib";

const GuidesIndexClient = dynamic(() => import("./GuidesIndexClient"), {
  loading: () => <GuidesContentSkeleton />,
});

export default async function GuidesPage() {
  const [guideItems, championIndex] = await Promise.all([
    fetchGuideSummariesFromApi(),
    fetchChampionIndexFromApi(),
  ]);

  const guideItemsBySlug = new Map(guideItems.map((item) => [item.slug, item]));
  const hydratedItems = championIndex.map((champion) => {
    const guide = guideItemsBySlug.get(champion.slug);

    if (guide) {
      return {
        ...guide,
        localizedName: champion.name || guide.name || null,
        iconUrl: guide.iconUrl || champion.iconUrl || null,
        roles: guide.roles?.length ? guide.roles : champion.roles || [],
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
