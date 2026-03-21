import PageWrapper from "@/components/PageWrapper";
import GuidesIndexClient from "./GuidesIndexClient";
import { fetchGuideSummariesFromApi } from "./guides-lib";

export default async function GuidesPage() {
  const items = await fetchGuideSummariesFromApi();

  return (
    <PageWrapper
      showBack
      title="Гайды по чемпионам"
      paragraphs={[
        "Каталог всех собранных гайдов. Открывай чемпиона и переходи в его полную страницу со сборками, рунами, прокачкой и матчапами.",
      ]}
    >
      <GuidesIndexClient items={items} />
    </PageWrapper>
  );
}
