import dynamic from "next/dynamic";
import PageWrapper from "@/components/PageWrapper";
import { GuidesContentSkeleton } from "@/components/ui/LazySkeletons";
import {
  type BulkResponse,
  hydrateGuideIndexItems,
  fetchChampionIndexFromApi,
  fetchGuideSummariesFromApi,
  fetchTierlistBulk,
} from "./guides-lib";

const GuidesIndexClient = dynamic(() => import("./GuidesIndexClient"), {
  loading: () => <GuidesContentSkeleton />,
});

export default async function GuidesPage() {
  const [guideItems, championIndex, tierlistBulk] = await Promise.all([
    fetchGuideSummariesFromApi(),
    fetchChampionIndexFromApi(),
    fetchTierlistBulk(),
  ]);

  const hydratedItems = hydrateGuideIndexItems(guideItems, championIndex, tierlistBulk);

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
