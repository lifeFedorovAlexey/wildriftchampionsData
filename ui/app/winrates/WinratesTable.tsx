"use client";

import Image from "next/image";

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

function formatPositionDelta(delta: number | null) {
  if (delta == null) {
    return { text: "—", color: "rgba(148, 163, 184, 0.82)" };
  }

  if (Object.is(delta, -0)) {
    delta = 0;
  }

  if (delta > 0) {
    return { text: `↑${delta}`, color: "#4ade80" };
  }

  if (delta < 0) {
    return { text: `↓${Math.abs(delta)}`, color: "#f87171" };
  }

  return { text: "0", color: "rgba(148, 163, 184, 0.82)" };
}

function ChampAvatar({
  name,
  src,
  isLcp,
}: {
  name: string;
  src?: string | null;
  isLcp?: boolean;
}) {
  const iconSrc = normalizeIconSrc(src);

  if (!iconSrc) return <div className={styles.avatar} aria-hidden="true" />;

  return (
    <div className={styles.avatar}>
      <Image
        src={iconSrc}
        alt={name}
        width={32}
        height={32}
        sizes="32px"
        loading={isLcp ? "eager" : "lazy"}
        fetchPriority={isLcp ? "high" : "auto"}
        className={styles.avatarImg}
      />
    </div>
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
      <div className={`${styles.grid} ${styles.header}`} role="row">
        <div className={styles.left}>#</div>
        <div className={styles.left}>Герой</div>
        <div className={styles.center}>7д</div>

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
          Винрейт
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
          Пики
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
          Баны
          <span className={styles.sortArrow}>
            {sort.column === "banRate" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
          </span>
        </button>
      </div>

      {rows.map((row, idx) => {
        const movement = formatPositionDelta(row.positionDelta);

        return (
          <div
            key={row.slug}
            className={`${styles.grid} ${styles.row}`}
            role="row"
          >
            <div className={styles.index}>{idx + 1}</div>

            <div className={styles.heroCell}>
              <ChampAvatar name={row.name} src={row.icon} isLcp={idx === 0} />
              <span className={styles.heroName} title={row.name}>
                {row.name}
              </span>
            </div>

            <div
              className={styles.center}
              style={{ color: movement.color, fontWeight: 700 }}
            >
              {movement.text}
            </div>

            <div
              className={styles.center}
              style={{ fontWeight: 700, color: row.tierColor }}
            >
              {row.tierLabel}
            </div>

            <div
              className={styles.metric}
              style={{ color: winRateColor(row.winRate) }}
            >
              {row.winRate != null ? `${row.winRate.toFixed(2)}%` : "—"}
            </div>

            <div
              className={styles.metric}
              style={{ color: pickRateColor(row.pickRate) }}
            >
              {row.pickRate != null ? `${row.pickRate.toFixed(2)}%` : "—"}
            </div>

            <div
              className={styles.metric}
              style={{ color: banRateColor(row.banRate) }}
            >
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
