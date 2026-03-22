import PageWrapper from "@/components/PageWrapper";
import styles from "./LazySkeletons.module.css";

function Shimmer({
  className = "",
}: {
  className?: string;
}) {
  return <span className={`${styles.shimmer} ${className}`.trim()} aria-hidden="true" />;
}

export function FiltersSkeleton() {
  return (
    <section className={styles.filters}>
      <div className={styles.pills}>
        {Array.from({ length: 5 }, (_, index) => (
          <Shimmer key={`pill-${index}`} className={`${styles.line} ${styles.pill}`} />
        ))}
      </div>
      <div className={styles.circles}>
        {Array.from({ length: 5 }, (_, index) => (
          <Shimmer key={`circle-${index}`} className={styles.circle} />
        ))}
      </div>
    </section>
  );
}

export function SearchSkeleton() {
  return <Shimmer className={styles.search} />;
}

export function PillsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.pills}>
      {Array.from({ length: count }, (_, index) => (
        <Shimmer key={index} className={`${styles.line} ${styles.pill}`} />
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <section className={styles.tableShell}>
      <div className={styles.tableTop}>
        <Shimmer className={`${styles.line} ${styles.tableTitle}`} />
        <Shimmer className={`${styles.line} ${styles.tableMeta}`} />
      </div>

      <div className={styles.tableHeader}>
        {Array.from({ length: 7 }, (_, index) => (
          <Shimmer key={`head-${index}`} className={`${styles.line} ${styles.smallMetric}`} />
        ))}
      </div>

      {Array.from({ length: 10 }, (_, rowIndex) => (
        <div key={`row-${rowIndex}`} className={styles.tableRow}>
          <Shimmer className={`${styles.line} ${styles.index}`} />
          <div className={styles.heroCell}>
            <Shimmer className={styles.avatar} />
            <div className={styles.heroCopy}>
              <Shimmer className={`${styles.line} ${styles.heroName}`} />
              <Shimmer className={`${styles.line} ${styles.heroSub}`} />
            </div>
          </div>
          <Shimmer className={`${styles.line} ${styles.smallMetric}`} />
          <Shimmer className={styles.tierBlock} />
          <Shimmer className={`${styles.line} ${styles.smallMetric}`} />
          <Shimmer className={`${styles.line} ${styles.smallMetric}`} />
          <Shimmer className={`${styles.line} ${styles.smallMetric}`} />
        </div>
      ))}
    </section>
  );
}

export function WinratesSkeleton({ embedded = false }: { embedded?: boolean }) {
  const content = (
    <div className={styles.pageStack}>
      {!embedded ? null : (
        <section className={styles.hero}>
          <Shimmer className={`${styles.line} ${styles.heroTitle}`} />
          <Shimmer className={`${styles.line} ${styles.heroText}`} />
          <Shimmer className={`${styles.line} ${styles.heroTextShort}`} />
        </section>
      )}

      <FiltersSkeleton />
      <TableSkeleton />
    </div>
  );

  if (embedded) return content;

  return (
    <PageWrapper
      title="Винрейты, пики и баны чемпионов Wild Rift"
      paragraphs={[
        "Смотри актуальную силу чемпионов по линиям и рангам: винрейт, пикрейт, банрейт и итоговый тир на одном экране.",
      ]}
    >
      {content}
    </PageWrapper>
  );
}

export function TierlistSkeleton() {
  return (
    <PageWrapper
      title="Автоматический тир-лист чемпионов Wild Rift"
      paragraphs={[
        "Тир-лист строится автоматически на основе статистических данных strength level.",
      ]}
    >
      <div className={styles.pageStack}>
        <FiltersSkeleton />

        <section className={styles.panel}>
          <Shimmer className={`${styles.line} ${styles.tableTitle}`} />
          <Shimmer className={`${styles.line} ${styles.heroText}`} />
        </section>

        <div className={styles.tierRows}>
          {["S+", "S", "A", "B"].map((tier) => (
            <div key={tier} className={styles.tierRow}>
              <Shimmer className={`${styles.line} ${styles.tierHead}`} />
              <div className={styles.tierChampions}>
                {Array.from({ length: 8 }, (_, index) => (
                  <Shimmer key={`${tier}-${index}`} className={styles.tierChamp} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
}

export function GuidesContentSkeleton() {
  return (
    <section className={styles.pageStack}>
      <div className={styles.searchWrap}>
        <SearchSkeleton />
        <Shimmer className={`${styles.line} ${styles.tableMeta}`} />
      </div>

      <div className={styles.guideGrid}>
        {Array.from({ length: 6 }, (_, index) => (
          <article key={index} className={styles.guideCard}>
            <div className={styles.guideTop}>
              <Shimmer className={styles.guideIcon} />
              <div className={styles.guideCopy}>
                <Shimmer className={`${styles.line} ${styles.guideName}`} />
                <Shimmer className={`${styles.line} ${styles.guideTitle}`} />
              </div>
            </div>
            <div className={styles.pills}>
              <Shimmer className={styles.chip} />
              <Shimmer className={styles.chip} />
            </div>
            <div className={styles.guideStats}>
              <Shimmer className={styles.statChip} />
              <Shimmer className={styles.statChip} />
              <Shimmer className={styles.statChip} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function GuidesSkeleton() {
  return (
    <PageWrapper
      title="Гайды по чемпионам"
      paragraphs={[
        "Каталог всех собранных гайдов. Открывай чемпиона и переходи в его полную страницу со сборками, рунами, прокачкой и матчапами.",
      ]}
    >
      <GuidesContentSkeleton />
    </PageWrapper>
  );
}

export function SkinsSkeleton() {
  return (
    <PageWrapper
      title="Скины"
      paragraphs={[
        "Просмотр 3D-моделей фанатских скинов чемпионов League of Legends — соответствующих и не совсем версии Wild Rift.",
      ]}
    >
      <div className={styles.skinsGrid}>
        {Array.from({ length: 8 }, (_, index) => (
          <Shimmer key={index} className={styles.skinCard} />
        ))}
      </div>
    </PageWrapper>
  );
}

export function ChartSkeleton() {
  return <Shimmer className={styles.chart} />;
}

export function SocialsSkeleton() {
  return (
    <div className={styles.socials}>
      {Array.from({ length: 6 }, (_, index) => (
        <Shimmer key={index} className={styles.socialDot} />
      ))}
    </div>
  );
}
