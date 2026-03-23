import PageWrapper from "@/components/PageWrapper";
import styles from "./WinratesClient.module.css";
import tableStyles from "./WinratesTable.module.css";

function SkeletonRow({ index }: { index: number }) {
  return (
    <div className={`${tableStyles.grid} ${tableStyles.row}`}>
      <div className={tableStyles.index}>{index}</div>
      <div className={tableStyles.heroCell}>
        <span className={styles.skeletonAvatar} />
        <span className={styles.skeletonName} />
      </div>
      <div className={`${tableStyles.trendCell} ${tableStyles.mobileOnly}`}>
        <span className={styles.skeletonTrend} />
        <span className={styles.skeletonValue} />
      </div>
      <div className={tableStyles.center}>
        <span className={styles.skeletonTier} />
      </div>
      <div className={tableStyles.metric}>
        <span className={styles.skeletonMetric} />
      </div>
      <div className={`${tableStyles.metricTrendCell} ${tableStyles.desktopOnly}`}>
        <span className={styles.skeletonTrend} />
      </div>
      <div className={tableStyles.metric}>
        <span className={styles.skeletonMetric} />
      </div>
      <div className={`${tableStyles.metricTrendCell} ${tableStyles.desktopOnly}`}>
        <span className={styles.skeletonTrend} />
      </div>
      <div className={tableStyles.metric}>
        <span className={styles.skeletonMetric} />
      </div>
      <div className={`${tableStyles.metricTrendCell} ${tableStyles.desktopOnly}`}>
        <span className={styles.skeletonTrend} />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <PageWrapper
      title="Винрейты, пики и баны чемпионов Wild Rift"
      paragraphs={[
        "Смотри актуальную силу чемпионов по линиям и рангам: винрейт, пикрейт, банрейт и итоговый тир на одном экране.",
      ]}
    >
      <div className={styles.shell}>
        <section className={styles.filtersPanel}>
          <div className={styles.filterSection}>
            <div className={styles.skeletonFilterBlock}>
              <div className={styles.skeletonChips}>
                {Array.from({ length: 5 }, (_, index) => (
                  <span key={`rank-${index}`} className={styles.skeletonChip} />
                ))}
              </div>
              <div className={styles.skeletonLanes}>
                {Array.from({ length: 5 }, (_, index) => (
                  <span key={`lane-${index}`} className={styles.skeletonLane} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.tableFrame} style={{ minHeight: "720px" }}>
          <div className={styles.tableTop}>
            <div>
              <strong className={styles.tableTitle}>Сводная таблица</strong>
              <p className={styles.tableMeta}>Загружаем свежий срез…</p>
            </div>
          </div>

          <div className={tableStyles.wrap}>
            <div className={`${tableStyles.grid} ${tableStyles.header}`}>
              <div className={tableStyles.left}>#</div>
              <div className={tableStyles.left}>Герой</div>
              <div className={`${tableStyles.center} ${tableStyles.mobileOnly}`}>7д</div>
              <div className={tableStyles.center}>Тир</div>
              <div className={tableStyles.right}>Винрейт</div>
              <div
                className={`${tableStyles.metricTrendHeader} ${tableStyles.desktopOnly}`}
                aria-hidden="true"
              />
              <div className={tableStyles.right}>Пики</div>
              <div
                className={`${tableStyles.metricTrendHeader} ${tableStyles.desktopOnly}`}
                aria-hidden="true"
              />
              <div className={tableStyles.right}>Баны</div>
              <div
                className={`${tableStyles.metricTrendHeader} ${tableStyles.desktopOnly}`}
                aria-hidden="true"
              />
            </div>

            {Array.from({ length: 12 }, (_, index) => (
              <SkeletonRow key={index} index={index + 1} />
            ))}
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}
