"use client";

import Image from "next/image";
import styles from "./WinratesTable.module.css";

type Row = {
  slug: string;
  name: string;
  icon: string | null;
  winRate: number | null;
  pickRate: number | null;
  banRate: number | null;
  tierLabel: string;
  tierColor: string;
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

function ChampAvatar({
  name,
  src,
  isLcp,
}: {
  name: string;
  src?: string | null;
  isLcp?: boolean;
}) {
  if (!src) return <div className={styles.avatar} aria-hidden="true" />;

  return (
    <div className={styles.avatar}>
      <Image
        src={src}
        alt={name}
        width={32}
        height={32}
        sizes="32px"
        quality={60}
        priority={!!isLcp}
        loading={isLcp ? "eager" : "lazy"}
        fetchPriority={isLcp ? "high" : "auto"}
        decoding="async"
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

        <button
          type="button"
          className={`${styles.right} ${styles.sortable}`}
          onClick={() => onSort("strengthLevel")}
        >
          Тир{" "}
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
          className={`${styles.right} ${styles.sortable}`}
          onClick={() => onSort("winRate")}
        >
          Победы{" "}
          <span className={styles.sortArrow}>
            {sort.column === "winRate" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
          </span>
        </button>

        <button
          type="button"
          className={`${styles.right} ${styles.sortable}`}
          onClick={() => onSort("pickRate")}
        >
          Пики{" "}
          <span className={styles.sortArrow}>
            {sort.column === "pickRate" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
          </span>
        </button>

        <button
          type="button"
          className={`${styles.right} ${styles.sortable}`}
          onClick={() => onSort("banRate")}
        >
          Баны{" "}
          <span className={styles.sortArrow}>
            {sort.column === "banRate" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
          </span>
        </button>
      </div>

      {rows.map((row, idx) => (
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
            className={styles.right}
            style={{ fontWeight: 700, color: row.tierColor }}
          >
            {row.tierLabel}
          </div>

          <div
            className={styles.right}
            style={{ color: winRateColor(row.winRate) }}
          >
            {row.winRate != null ? `${row.winRate.toFixed(2)}%` : "—"}
          </div>

          <div
            className={styles.right}
            style={{ color: pickRateColor(row.pickRate) }}
          >
            {row.pickRate != null ? `${row.pickRate.toFixed(2)}%` : "—"}
          </div>

          <div
            className={styles.right}
            style={{ color: banRateColor(row.banRate) }}
          >
            {row.banRate != null ? `${row.banRate.toFixed(2)}%` : "—"}
          </div>
        </div>
      ))}

      {!rows.length ? (
        <div className={styles.empty}>Нет данных для выбранных фильтров.</div>
      ) : null}
    </div>
  );
}
