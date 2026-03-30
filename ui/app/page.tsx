import WinratesClient from "./winrates/WinratesClient";
import {
  buildStatsUrls,
  fetchJson,
} from "./winrates/winrates-lib.js";
import styles from "./page.module.css";

const language = "ru_ru";

export const revalidate = 60;

type Champion = {
  slug: string;
  name?: string | null;
  icon?: string | null;
};

type HistoryItem = {
  date: string;
  slug: string;
  rank: string;
  lane: string;
  position?: number | null;
  winRate?: number | null;
  pickRate?: number | null;
  banRate?: number | null;
  strengthLevel?: number | null;
};

type PreparedRow = {
  slug: string;
  name: string;
  icon: string | null;
  winRate: number | null;
  pickRate: number | null;
  banRate: number | null;
  strengthLevel: number | null;
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

type SnapshotResponse = {
  items?: HistoryItem[];
  rowsBySlice?: Record<string, PreparedRow[]>;
  maxRowCount?: number;
};

export default async function HomePage() {
  let champions: Champion[] = [];
  let rowsBySlice: Record<string, PreparedRow[]> = {};
  let maxRowCount = 0;
  let error: string | null = null;
  let updatedAt: string | null = null;

  try {
    const { championsUrl, historyUrl, updatedAtUrl } = buildStatsUrls(language);

    const [champsJson, updatedJson] = await Promise.all([
      fetchJson(championsUrl, { next: { revalidate } }) as Promise<Champion[]>,
      fetchJson(updatedAtUrl, {
        next: { revalidate },
      }) as Promise<{ updatedAt?: string | null }>,
    ]);

    champions = Array.isArray(champsJson) ? champsJson : [];
    updatedAt =
      typeof updatedJson?.updatedAt === "string" ? updatedJson.updatedAt : null;

    const snapshotUrl = updatedAt
      ? `${historyUrl}?updatedAt=${encodeURIComponent(updatedAt)}`
      : historyUrl;

    const histJson = (await fetchJson(snapshotUrl, {
      next: { revalidate },
    })) as SnapshotResponse;

    void champions;
    rowsBySlice =
      histJson && typeof histJson === "object" && "rowsBySlice" in histJson
        ? (histJson.rowsBySlice as Record<string, PreparedRow[]>)
        : {};
    maxRowCount =
      histJson && typeof histJson === "object" && typeof histJson.maxRowCount === "number"
        ? histJson.maxRowCount
        : 0;
  } catch (err) {
    console.error("Home winrates load error:", err);
    error = "Не удалось загрузить статистику чемпионов.";
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>Статистика чемпионов</h1>
        <p className={styles.lead}>
          Здесь собраны ключевые метрики по Wild Rift: винрейты, популярность и
          эффективность чемпионов. Данные обновляются регулярно, чтобы можно было
          быстро понять, что сейчас реально работает в игре.
        </p>
      </section>

      <WinratesClient
        rowsBySlice={rowsBySlice}
        maxRowCount={maxRowCount}
        error={error}
        updatedAt={updatedAt}
        embedded
      />
    </div>
  );
}
