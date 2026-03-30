"use client";

import { useEffect, useMemo, useState } from "react";

import ChampionAvatar from "@/components/ui/ChampionAvatar";
import LoadingRing from "@/components/LoadingRing";
import PageWrapper from "@/components/PageWrapper";
import styles from "./page.module.css";
import { API_BASE } from "@/constants/apiBase";
import {
  aggregateLatestPicksBans,
  buildLaneDetails,
} from "./picks-bans-lib";

type ChampionRecord = {
  slug: string;
  name?: string | null;
  icon?: string | null;
};

type AggregatedChampion = {
  slug: string;
  name: string;
  totalPickRate: number;
  totalBanRate: number;
  lanes: Record<string, any>;
};

type DetailsState =
  | null
  | {
      index: number;
      champ: AggregatedChampion;
      type: "pick" | "ban";
    };

function TopChampCard({
  index,
  champ,
  type,
  imgUrl,
  onClick,
}: {
  index: number;
  champ: AggregatedChampion;
  type: "pick" | "ban";
  imgUrl?: string | null;
  onClick: () => void;
}) {
  const totalValue =
    type === "pick" ? champ.totalPickRate || 0 : champ.totalBanRate || 0;
  const metricLabel =
    type === "pick" ? "Средний пикрейт" : "Средний банрейт";
  const accentClass =
    type === "pick" ? styles.valuePick : styles.valueBan;

  return (
    <button type="button" className={styles.cardRow} onClick={onClick}>
      <div className={styles.cardRank}>#{index + 1}</div>

      <ChampionAvatar
        name={champ.name}
        src={imgUrl}
        mobileSize={40}
        desktopSize={52}
        mobileRadius={12}
        desktopRadius={14}
      />

      <div className={styles.cardBody}>
        <div className={styles.cardTitleRow}>
          <div className={styles.cardName}>{champ.name}</div>
          <div className={`${styles.cardValue} ${accentClass}`}>
            {totalValue.toFixed(2)}%
          </div>
        </div>
        <div className={styles.cardMeta}>
          <span className={styles.cardSlug}>{champ.slug}</span>
          <span>{metricLabel}</span>
        </div>
      </div>
    </button>
  );
}

function DetailsModal({
  data,
  onClose,
}: {
  data: DetailsState;
  onClose: () => void;
}) {
  if (!data) return null;

  const { index, champ, type } = data;
  const totalValue =
    type === "pick" ? champ.totalPickRate || 0 : champ.totalBanRate || 0;
  const laneEntries = buildLaneDetails({ champ, type });
  const metricLabel =
    type === "pick" ? "Средний пикрейт" : "Средний банрейт";

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalTop}>
          <div>
            <div className={styles.modalEyebrow}>
              #{index + 1} · {metricLabel}
            </div>
            <h3 className={styles.modalTitle}>{champ.name}</h3>
            <div className={styles.modalSummary}>
              {champ.slug} · {totalValue.toFixed(2)}%
            </div>
          </div>

          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.modalSectionTitle}>Разбивка по линиям</div>

        {laneEntries.length ? (
          <div className={styles.modalList}>
            {laneEntries.map(({ laneKey, laneTotal, parts, displayLaneName }) => (
              <div key={laneKey} className={styles.modalRow}>
                <div className={styles.modalLane}>{displayLaneName}</div>
                <div className={styles.modalLaneValue}>{laneTotal.toFixed(2)}%</div>
                {parts.length ? (
                  <div className={styles.modalLaneMeta}>{parts.join(" · ")}</div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.modalEmpty}>
            Для этого чемпиона нет детальной статистики.
          </div>
        )}
      </div>
    </div>
  );
}

export default function PicksBansPage() {
  const language = "ru_ru";

  const [champions, setChampions] = useState<ChampionRecord[]>([]);
  const [champImages, setChampImages] = useState<Record<string, string | null>>(
    {},
  );
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<DetailsState>(null);

  const [limit, setLimit] = useState<5 | 10 | 20 | "all">(5);
  const [rankRange, setRankRange] = useState<"low" | "high" | "all">("low");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/champions?lang=${encodeURIComponent(language)}`,
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        if (cancelled) return;

        setChampions(json || []);

        const imageMap: Record<string, string | null> = {};
        (json || []).forEach((champion: ChampionRecord) => {
          if (champion?.slug) imageMap[champion.slug] = champion.icon || null;
        });
        setChampImages(imageMap);
      } catch {
        // leave page usable without icons
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE}/api/latest-stats-snapshot`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        if (cancelled) return;

        const items = Array.isArray(json.items) ? json.items : [];
        setHistoryItems(items);
      } catch {
        if (!cancelled) {
          setError("Не удалось загрузить статистику пиков и банов.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const aggregated = useMemo(() => {
    return aggregateLatestPicksBans({
      latestItems: historyItems,
      champions,
      rankRange,
    });
  }, [historyItems, champions, rankRange]);

  const topPicks = useMemo(() => {
    const sorted = [...aggregated].sort(
      (left, right) => (right.totalPickRate || 0) - (left.totalPickRate || 0),
    );
    return limit === "all" ? sorted : sorted.slice(0, limit);
  }, [aggregated, limit]);

  const topBans = useMemo(() => {
    const sorted = [...aggregated].sort(
      (left, right) => (right.totalBanRate || 0) - (left.totalBanRate || 0),
    );
    return limit === "all" ? sorted : sorted.slice(0, limit);
  }, [aggregated, limit]);

  const limitLabel =
    limit === "all" ? "Все чемпионы" : `Топ-${limit} чемпионов`;
  const rankRangeLabel =
    rankRange === "low"
      ? "алмаз + мастер"
      : rankRange === "high"
        ? "гм + претендент"
        : "все ранги";

  if (loading) {
    return <LoadingRing label="Считаю пики и баны..." />;
  }

  return (
    <PageWrapper
      title="Пики и баны в Wild Rift"
      paragraphs={[
        "Ниже собраны чемпионы, которых чаще всего выбирают и запрещают в рейтинговых матчах. Данные сгруппированы по последнему срезу и помогают быстро увидеть, кто доминирует в текущей мете.",
      ]}
    >
      {error ? (
        <div className={styles.errorBox}>{error}</div>
      ) : (
        <div className={styles.shell}>
          <section className={styles.filtersPanel}>
            <div className={styles.filterBlock}>
              <div className={styles.filterLabel}>Объем выдачи</div>
              <div className={styles.pillRow}>
                {[5, 10, 20].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`${styles.pill} ${limit === value ? styles.pillActive : ""}`}
                    onClick={() => setLimit(value as 5 | 10 | 20)}
                  >
                    Топ {value}
                  </button>
                ))}
                <button
                  type="button"
                  className={`${styles.pill} ${limit === "all" ? styles.pillActive : ""}`}
                  onClick={() => setLimit("all")}
                >
                  Все
                </button>
              </div>
            </div>

            <div className={styles.filterBlock}>
              <div className={styles.filterLabel}>Диапазон рангов</div>
              <div className={styles.pillRow}>
                <button
                  type="button"
                  className={`${styles.pill} ${rankRange === "low" ? styles.pillActive : ""}`}
                  onClick={() => setRankRange("low")}
                >
                  Лоу эло
                </button>
                <button
                  type="button"
                  className={`${styles.pill} ${rankRange === "high" ? styles.pillActive : ""}`}
                  onClick={() => setRankRange("high")}
                >
                  Хай эло
                </button>
                <button
                  type="button"
                  className={`${styles.pill} ${rankRange === "all" ? styles.pillActive : ""}`}
                  onClick={() => setRankRange("all")}
                >
                  Все ранги
                </button>
              </div>
            </div>

            <div className={styles.filterNote}>
              <span>{limitLabel}</span>
              <span>·</span>
              <span>{rankRangeLabel}</span>
              <span>·</span>
              <span>клик по карточке открывает разбивку по линиям</span>
            </div>
          </section>

          <section className={styles.tableFrame}>
            <div className={styles.tableTop}>
              <div>
                <strong className={styles.tableTitle}>Топ по пикам</strong>
                <p className={styles.tableMeta}>
                  Чемпионы с самым высоким средним пикрейтом по выбранному срезу.
                </p>
              </div>
            </div>

            <div className={styles.sectionBody}>
              {topPicks.length ? (
                topPicks.map((champion, index) => (
                  <TopChampCard
                    key={`pick-${champion.slug}`}
                    index={index}
                    champ={champion}
                    type="pick"
                    imgUrl={champImages[champion.slug]}
                    onClick={() =>
                      setDetails({ index, champ: champion, type: "pick" })
                    }
                  />
                ))
              ) : (
                <div className={styles.emptyState}>
                  Нет данных для расчета пиков.
                </div>
              )}
            </div>
          </section>

          <section className={styles.tableFrame}>
            <div className={styles.tableTop}>
              <div>
                <strong className={styles.tableTitle}>Топ по банам</strong>
                <p className={styles.tableMeta}>
                  Чемпионы с самым высоким средним банрейтом по выбранному срезу.
                </p>
              </div>
            </div>

            <div className={styles.sectionBody}>
              {topBans.length ? (
                topBans.map((champion, index) => (
                  <TopChampCard
                    key={`ban-${champion.slug}`}
                    index={index}
                    champ={champion}
                    type="ban"
                    imgUrl={champImages[champion.slug]}
                    onClick={() =>
                      setDetails({ index, champ: champion, type: "ban" })
                    }
                  />
                ))
              ) : (
                <div className={styles.emptyState}>
                  Нет данных для расчета банов.
                </div>
              )}
            </div>
          </section>

          <DetailsModal data={details} onClose={() => setDetails(null)} />
        </div>
      )}
    </PageWrapper>
  );
}
