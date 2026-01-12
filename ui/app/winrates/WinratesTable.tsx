"use client";

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

/**
 * Делает src стабильным:
 * - если пришёл абсолютный url на твой домен и внутри есть "/wr-api/..." — превращаем в относительный "/wr-api/..."
 *   чтобы не ломать кеш из-за www/без www/прокси.
 */
function normalizeIconSrc(src?: string | null) {
  if (!src) return null;

  // Уже относительный
  if (src.startsWith("/")) return src;

  try {
    const u = new URL(src);
    const i = u.pathname.indexOf("/wr-api/");
    if (i !== -1) {
      const path = u.pathname.slice(i) + (u.search || "");
      return path;
    }
    return src;
  } catch {
    return src;
  }
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
      <img
        src={iconSrc}
        alt={name}
        width={32}
        height={32}
        className={styles.avatarImg}
        loading={isLcp ? "eager" : "lazy"}
        fetchPriority={isLcp ? "high" : "auto"}
        decoding="async"
        sizes="32px"
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
