"use client";

import { useEffect, useRef, type CSSProperties } from "react";

import ChampionAvatar from "@/components/ui/ChampionAvatar";
import TrendSparkline from "@/components/styled/TrendSparkline";

import styles from "./WinratesTable.module.css";
import { normalizeIconSrc } from "./winrates-lib.js";

type Row = {
  slug: string;
  name: string;
  icon: string | null;
  winRate: number | null;
  pickRate: number | null;
  banRate: number | null;
  tierLabel: string;
  tierColor: string;
  positionDelta: number | null;
  positionTrend: Array<number | null>;
  winRateTrend: Array<number | null>;
  pickRateTrend: Array<number | null>;
  banRateTrend: Array<number | null>;
  winRateDelta: number | null;
  pickRateDelta: number | null;
  banRateDelta: number | null;
};

function winRateColor(v: number | null) {
  if (v == null) return "inherit";
  if (v > 50) return "#4ade80";
  if (v < 50) return "#f97373";
  return "inherit";
}

function pickRateColor(v: number | null) {
  if (v == null) return "inherit";
  if (v < 3) return "#f97373";
  return "#4ade80";
}

function banRateColor(v: number | null) {
  if (v == null) return "inherit";
  if (v > 10) return "#f97373";
  return "#4ade80";
}

function formatPercentDelta(delta: number | null) {
  if (delta == null) {
    return { text: "—", color: "rgba(148, 163, 184, 0.82)" };
  }

  if (Object.is(delta, -0)) {
    delta = 0;
  }

  if (delta > 0) {
    return { text: `+${delta.toFixed(2)}%`, color: "#4ade80" };
  }

  if (delta < 0) {
    return { text: `${delta.toFixed(2)}%`, color: "#f87171" };
  }

  return { text: "0.00%", color: "rgba(148, 163, 184, 0.82)" };
}

function MetricCell({
  value,
  valueColor,
  trendValues,
  movement,
}: {
  value: number | null;
  valueColor: string;
  trendValues: Array<number | null>;
  movement: { text: string; color: string };
}) {
  return (
    <div
      className={`${styles.metricCell} ${styles.desktopOnly}`}
      style={{ "--metric-accent": movement.color } as CSSProperties}
    >
      <div className={styles.metricTrendInline}>
        <TrendSparkline values={trendValues} color={movement.color} />
        <span className={styles.trendValue}>{movement.text}</span>
      </div>
      <div className={styles.metric} style={{ color: valueColor }}>
        {value != null ? `${value.toFixed(2)}%` : "—"}
      </div>
    </div>
  );
}

function MobileMetricValue({
  value,
  valueColor,
}: {
  value: number | null;
  valueColor: string;
}) {
  return (
    <div className={styles.mobileMetric} style={{ color: valueColor }}>
      {value != null ? `${value.toFixed(2)}%` : "—"}
    </div>
  );
}

export default function WinratesTable({
  rows,
  sort,
  onSort,
  onListEnd,
  listContextKey,
}: {
  rows: Row[];
  sort: { column: string | null; dir: "asc" | "desc" | null };
  onSort: (c: "strengthLevel" | "winRate" | "pickRate" | "banRate") => void;
  onListEnd?: () => void;
  listContextKey?: string;
}) {
  const endSentinelRef = useRef<HTMLDivElement>(null);
  const userHasScrolled = useRef(false);

  useEffect(() => {
    const markScrolled = () => {
      if (window.scrollY > 240) userHasScrolled.current = true;
    };
    window.addEventListener("scroll", markScrolled, { passive: true });
    return () => window.removeEventListener("scroll", markScrolled);
  }, []);

  useEffect(() => {
    const sentinel = endSentinelRef.current;
    if (!sentinel || !onListEnd || !rows.length) return;

    let hasLeftTheEnd = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (!entry.isIntersecting) {
          hasLeftTheEnd = true;
          return;
        }
        if (hasLeftTheEnd && userHasScrolled.current) onListEnd();
      },
      { threshold: 0.75 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [listContextKey, onListEnd, rows.length]);

  return (
    <div className={styles.wrap}>
      <div className={`${styles.grid} ${styles.header}`}>
        <div className={styles.left}>#</div>
        <div className={styles.left}>Герой</div>
        <div className={`${styles.center} ${styles.mobileOnly}`}>7д</div>

        <button
          type="button"
          className={`${styles.sortable} ${styles.sortableCenter}`}
          onClick={() => onSort("strengthLevel")}
          aria-label="Сортировать по тиру"
        >
          Тир
          <span className={styles.sortArrow}>
            {sort.column === "strengthLevel"
              ? sort.dir === "asc"
                ? "▲"
                : "▼"
              : ""}
          </span>
        </button>

        <button
          type="button"
          className={`${styles.sortable} ${styles.sortableEnd}`}
          onClick={() => onSort("winRate")}
          aria-label="Сортировать по винрейту"
        >
          <span className={styles.labelFull}>Винрейт</span>
          <span className={styles.labelShort}>WR</span>
          <span className={styles.sortArrow}>
            {sort.column === "winRate" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
          </span>
        </button>

        <button
          type="button"
          className={`${styles.sortable} ${styles.sortableEnd}`}
          onClick={() => onSort("pickRate")}
          aria-label="Сортировать по пикрейту"
        >
          <span className={styles.labelFull}>Пики</span>
          <span className={styles.labelShort}>PR</span>
          <span className={styles.sortArrow}>
            {sort.column === "pickRate" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
          </span>
        </button>

        <button
          type="button"
          className={`${styles.sortable} ${styles.sortableEnd}`}
          onClick={() => onSort("banRate")}
          aria-label="Сортировать по банрейту"
        >
          <span className={styles.labelFull}>Баны</span>
          <span className={styles.labelShort}>BR</span>
          <span className={styles.sortArrow}>
            {sort.column === "banRate" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
          </span>
        </button>
      </div>

      {rows.map((row, idx) => {
        const movement = formatPercentDelta(row.positionDelta);
        const winRateMovement = formatPercentDelta(row.winRateDelta);
        const pickRateMovement = formatPercentDelta(row.pickRateDelta);
        const banRateMovement = formatPercentDelta(row.banRateDelta);

        return (
          <div key={row.slug} className={`${styles.grid} ${styles.row}`}>
            <div className={styles.index}>{idx + 1}</div>

            <div className={styles.heroCell}>
              <ChampionAvatar
                name={row.name}
                src={normalizeIconSrc(row.icon)}
                mobileSize={26}
                desktopSize={34}
                mobileRadius={10}
                desktopRadius={12}
                loading={idx === 0 ? "eager" : "lazy"}
                fetchPriority={idx === 0 ? "high" : undefined}
                className={styles.avatar}
                imageClassName={styles.avatarImg}
              />
              <span className={styles.heroName} title={row.name}>
                {row.name}
              </span>
            </div>

            <div
              className={`${styles.trendCell} ${styles.mobileOnly}`}
              style={{ color: movement.color }}
            >
              <TrendSparkline values={row.positionTrend} color={movement.color} />
              <span className={styles.trendValue}>{movement.text}</span>
            </div>

            <div
              className={styles.center}
              style={{ fontWeight: 700, color: row.tierColor }}
            >
              {row.tierLabel}
            </div>

            <MetricCell
              value={row.winRate}
              valueColor={winRateColor(row.winRate)}
              trendValues={row.winRateTrend}
              movement={winRateMovement}
            />
            <MobileMetricValue
              value={row.winRate}
              valueColor={winRateColor(row.winRate)}
            />

            <MetricCell
              value={row.pickRate}
              valueColor={pickRateColor(row.pickRate)}
              trendValues={row.pickRateTrend}
              movement={pickRateMovement}
            />
            <MobileMetricValue
              value={row.pickRate}
              valueColor={pickRateColor(row.pickRate)}
            />

            <MetricCell
              value={row.banRate}
              valueColor={banRateColor(row.banRate)}
              trendValues={row.banRateTrend}
              movement={banRateMovement}
            />
            <MobileMetricValue
              value={row.banRate}
              valueColor={banRateColor(row.banRate)}
            />
          </div>
        );
      })}

      {!rows.length ? (
        <div className={styles.empty}>Нет данных для выбранных фильтров.</div>
      ) : null}
      <div ref={endSentinelRef} aria-hidden="true" />
    </div>
  );
}
