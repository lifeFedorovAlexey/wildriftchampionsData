import dynamic from "next/dynamic";
import PageWrapper from "@/components/PageWrapper";
import { GuidesContentSkeleton } from "@/components/ui/LazySkeletons";
import {
  fetchChampionNamesFromApi,
  fetchGuideSummariesFromApi,
} from "./guides-lib";

const GuidesIndexClient = dynamic(() => import("./GuidesIndexClient"), {
  loading: () => <GuidesContentSkeleton />,
});

export default async function GuidesPage() {
  const [items, localizedNames] = await Promise.all([
    fetchGuideSummariesFromApi(),
    fetchChampionNamesFromApi(),
  ]);

  const hydratedItems = items.map((item) => ({
    ...item,
    localizedName: localizedNames[item.slug] || null,
  }));

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
