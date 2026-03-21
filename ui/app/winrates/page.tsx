import WinratesClient from "./WinratesClient";
import {
  buildPreparedWinrateSlices,
  buildStatsUrls,
  fetchJson,
} from "./winrates-lib.js";

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
};

export default async function Page() {
  let champions: Champion[] = [];
  let rowsBySlice: Record<string, PreparedRow[]> = {};
  let sliceHistoryByKey: Record<
    string,
    Array<{ date: string; rows: PreparedRow[] }>
  > = {};
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
    console.error("Winrates load error:", err);
    error = "Не удалось загрузить статистику винрейтов.";
  }

  return (
    <WinratesClient
      rowsBySlice={rowsBySlice}
      sliceHistoryByKey={sliceHistoryByKey}
      maxRowCount={maxRowCount}
      error={error}
      updatedAt={updatedAt}
    />
  );
}
