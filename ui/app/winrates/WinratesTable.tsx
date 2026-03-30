"use client";

import ChampionAvatar from "@/components/ui/ChampionAvatar";

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

  const width = 32;
  const height = 12;
  const paddingX = 2;
  const paddingY = 2;
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
      <circle
        cx={lastX}
        cy={lastY}
        r="1.8"
        fill={color}
        className={styles.sparkDot}
      />
    </svg>
  );
}

export default function WinratesTable({
  rows,
  sort,
  onSort,
}: {
  rows: Row[];
  sort: { column: string | null; dir: "asc" | "desc" | null };
  onSort: (c: "strengthLevel" | "winRate" | "pickRate" | "banRate") => void;
}) {
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

        <div
          className={`${styles.metricTrendHeader} ${styles.desktopOnly}`}
          aria-hidden="true"
        />
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

        <div
          className={`${styles.metricTrendHeader} ${styles.desktopOnly}`}
          aria-hidden="true"
        />
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

        <div
          className={`${styles.metricTrendHeader} ${styles.desktopOnly}`}
          aria-hidden="true"
        />
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

            <div
              className={`${styles.metricTrendCell} ${styles.desktopOnly}`}
              style={{ color: winRateMovement.color }}
            >
              <TrendSparkline
                values={row.winRateTrend}
                color={winRateMovement.color}
              />
              <span className={styles.trendValue}>{winRateMovement.text}</span>
            </div>
            <div className={styles.metric} style={{ color: winRateColor(row.winRate) }}>
              {row.winRate != null ? `${row.winRate.toFixed(2)}%` : "—"}
            </div>

            <div
              className={`${styles.metricTrendCell} ${styles.desktopOnly}`}
              style={{ color: pickRateMovement.color }}
            >
              <TrendSparkline
                values={row.pickRateTrend}
                color={pickRateMovement.color}
              />
              <span className={styles.trendValue}>{pickRateMovement.text}</span>
            </div>
            <div className={styles.metric} style={{ color: pickRateColor(row.pickRate) }}>
              {row.pickRate != null ? `${row.pickRate.toFixed(2)}%` : "—"}
            </div>

            <div
              className={`${styles.metricTrendCell} ${styles.desktopOnly}`}
              style={{ color: banRateMovement.color }}
            >
              <TrendSparkline
                values={row.banRateTrend}
                color={banRateMovement.color}
              />
              <span className={styles.trendValue}>{banRateMovement.text}</span>
            </div>
            <div className={styles.metric} style={{ color: banRateColor(row.banRate) }}>
              {row.banRate != null ? `${row.banRate.toFixed(2)}%` : "—"}
            </div>
          </div>
        );
      })}

      {!rows.length ? (
        <div className={styles.empty}>Нет данных для выбранных фильтров.</div>
      ) : null}
    </div>
  );
}
