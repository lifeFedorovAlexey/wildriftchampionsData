import dynamic from "next/dynamic";
import { WinratesSkeleton } from "@/components/ui/LazySkeletons";
import {
  buildPreparedWinrateSlices,
  buildStatsUrls,
  fetchJson,
} from "./winrates/winrates-lib.js";
import styles from "./page.module.css";

const WinratesClient = dynamic(() => import("./winrates/WinratesClient"), {
  loading: () => <WinratesSkeleton embedded />,
});

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

export default async function HomePage() {
  let champions: Champion[] = [];
  let rowsBySlice: Record<string, PreparedRow[]> = {};
  let sliceHistoryByKey: Record<string, Array<{ date: string; rows: PreparedRow[] }>> = {};
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
    })) as { items?: HistoryItem[] };

    const historyItems = Array.isArray(histJson.items) ? histJson.items : [];
    const prepared = buildPreparedWinrateSlices({
      champions,
      historyItems,
    }) as {
      rowsBySlice: Record<string, PreparedRow[]>;
      sliceHistoryByKey: Record<string, Array<{ date: string; rows: PreparedRow[] }>>;
      maxRowCount: number;
    };

    rowsBySlice = prepared.rowsBySlice;
    sliceHistoryByKey = prepared.sliceHistoryByKey;
    maxRowCount = prepared.maxRowCount;
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
        sliceHistoryByKey={sliceHistoryByKey}
        maxRowCount={maxRowCount}
        error={error}
        updatedAt={updatedAt}
        embedded
      />
    </div>
  );
}
