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

type TrendInfo = {
  pickRateTrend: Array<number | null>;
  banRateTrend: Array<number | null>;
  pickRateDelta: number | null;
  banRateDelta: number | null;
};

type MonthlyByRange = {
  low: Record<string, TrendInfo>;
  high: Record<string, TrendInfo>;
  all: Record<string, TrendInfo>;
};

type DetailsState =
  | null
  | {
      index: number;
      champ: AggregatedChampion;
      type: "pick" | "ban";
    };

const LANE_LABELS: Record<string, string> = {
  top: "Топ",
  jungle: "Лес",
  mid: "Мид",
  adc: "ADC",
  support: "Саппорт",
  all: "Все линии",
};

function formatPercentDelta(delta: number | null) {
  if (delta == null) {
    return { text: "—", color: "rgba(148, 163, 184, 0.82)" };
  }

  if (Object.is(delta, -0)) {
    delta = 0;
  }

  if (delta > 0) {
    return { text: `+${delta.toFixed(2)}%`, color: "#86efac" };
  }

  if (delta < 0) {
    return { text: `${delta.toFixed(2)}%`, color: "#fda4af" };
  }

  return { text: "0.00%", color: "rgba(148, 163, 184, 0.82)" };
}

function TrendSparkline({
  values,
  color,
}: {
  values: Array<number | null>;
  color: string;
}) {
  const points = values
    .map((value, index) => ({ value, index }))
    .filter(
      (point): point is { value: number; index: number } =>
        typeof point.value === "number" && Number.isFinite(point.value),
    );

  if (points.length < 2) {
    return <span className={styles.sparkPlaceholder} aria-hidden="true" />;
  }

  const width = 94;
  const height = 28;
  const paddingX = 2;
  const paddingY = 3;
  const minValue = Math.min(...points.map((point) => point.value));
  const maxValue = Math.max(...points.map((point) => point.value));
  const valueRange = Math.max(maxValue - minValue, 1);
  const stepX =
    values.length > 1
      ? (width - paddingX * 2) / Math.max(values.length - 1, 1)
      : 0;

  const line = points
    .map((point, pointIndex) => {
      const x = paddingX + point.index * stepX;
      const y =
        paddingY +
        ((point.value - minValue) / valueRange) * (height - paddingY * 2);

      return `${pointIndex === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  const lastPoint = points[points.length - 1];
  const lastX = paddingX + lastPoint.index * stepX;
  const lastY =
    paddingY +
    ((lastPoint.value - minValue) / valueRange) * (height - paddingY * 2);

  return (
    <svg
      className={styles.sparkline}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden="true"
    >
      <path
        d={`M${paddingX} ${(height / 2).toFixed(2)} H${(width - paddingX).toFixed(2)}`}
        className={styles.sparkBase}
      />
      <path d={line} stroke={color} className={styles.sparkPath} />
      <circle cx={lastX} cy={lastY} r="2" fill={color} className={styles.sparkDot} />
    </svg>
  );
}

function getLanePresence(champ: AggregatedChampion, type: "pick" | "ban") {
  const entries = Object.entries(champ?.lanes || {})
    .filter(([laneKey, laneData]) => {
      if (laneKey === "all") return false;
      const value = type === "pick" ? laneData?.pick || 0 : laneData?.ban || 0;
      return value > 0;
    })
    .sort(([, left], [, right]) => {
      const leftValue = type === "pick" ? left?.pick || 0 : left?.ban || 0;
      const rightValue = type === "pick" ? right?.pick || 0 : right?.ban || 0;
      return rightValue - leftValue;
    })
    .map(([laneKey]) => LANE_LABELS[laneKey] || laneKey);

  return entries;
}

function TopChampCard({
  index,
  champ,
  type,
  imgUrl,
  trend,
  onClick,
}: {
  index: number;
  champ: AggregatedChampion;
  type: "pick" | "ban";
  imgUrl?: string | null;
  trend?: TrendInfo | null;
  onClick: () => void;
}) {
  const totalValue =
    type === "pick" ? champ.totalPickRate || 0 : champ.totalBanRate || 0;
  const metricLabel =
    type === "pick" ? "Средний пикрейт" : "Средний банрейт";
  const accentClass =
    type === "pick" ? styles.valuePick : styles.valueBan;
  const trendValues =
    type === "pick" ? trend?.pickRateTrend || [] : trend?.banRateTrend || [];
  const trendDelta =
    type === "pick" ? trend?.pickRateDelta ?? null : trend?.banRateDelta ?? null;
  const trendMovement = formatPercentDelta(trendDelta);
  const trendLabel =
    type === "pick" ? "Движение пикрейта за 30 дней" : "Движение банрейта за 30 дней";
  const lanePresence = getLanePresence(champ, type);

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
          <div className={styles.cardHeading}>
            <div className={styles.cardName}>{champ.name}</div>
            <div className={styles.cardMeta}>
              <span className={styles.cardSlug}>{champ.slug}</span>
              <span>{metricLabel}</span>
            </div>
            {lanePresence.length ? (
              <div className={styles.cardLanes}>
                {lanePresence.map((lane) => (
                  <span key={lane} className={styles.cardLaneChip}>
                    {lane}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className={styles.cardMetricBlock}>
            <div className={styles.cardTrend} title={trendLabel}>
              <TrendSparkline values={trendValues} color={trendMovement.color} />
              <span
                className={styles.cardTrendValue}
                style={{ color: trendMovement.color }}
              >
                {trendMovement.text}
              </span>
            </div>
            <div className={`${styles.cardValue} ${accentClass}`}>
              {totalValue.toFixed(2)}%
            </div>
          </div>
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
  const [monthlyByRange, setMonthlyByRange] = useState<MonthlyByRange>({
    low: {},
    high: {},
    all: {},
  });
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
        // keep page usable without icons
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
        const monthly =
          json?.picksBansMonthly &&
          typeof json.picksBansMonthly === "object" &&
          json.picksBansMonthly.byRange &&
          typeof json.picksBansMonthly.byRange === "object"
            ? json.picksBansMonthly.byRange
            : { low: {}, high: {}, all: {} };

        setHistoryItems(items);
        setMonthlyByRange({
          low: monthly.low || {},
          high: monthly.high || {},
          all: monthly.all || {},
        });
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

  const trendsForRange = monthlyByRange[rankRange] || {};

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
              <span>в карточке видно текущее значение и движение за 30 дней</span>
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
                    trend={trendsForRange[champion.slug] || null}
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
                    trend={trendsForRange[champion.slug] || null}
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
