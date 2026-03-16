import WinratesClient from "./WinratesClient";
import {
  buildLatestMap,
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
  winRate?: number | null;
  pickRate?: number | null;
  banRate?: number | null;
  strengthLevel?: number | null;
};

export default async function Page() {
  let champions: Champion[] = [];
  let latestStats: Record<string, HistoryItem> | null = null;
  let historyItems: HistoryItem[] = [];
  let error: string | null = null;
  let updatedAt: string | null = null;

  try {
    const { championsUrl, historyUrl } = buildStatsUrls(language);

    const [champsJson, histJson] = await Promise.all([
      fetchJson(championsUrl, { next: { revalidate } }) as Promise<Champion[]>,
      fetchJson(historyUrl, {
        next: { revalidate },
      }) as Promise<{ items?: HistoryItem[] }>,
    ]);

    champions = Array.isArray(champsJson) ? champsJson : [];
    historyItems = Array.isArray(histJson.items) ? histJson.items : [];
    latestStats = buildLatestMap(historyItems);
    updatedAt = new Date().toISOString();
  } catch (err) {
    console.error("Winrates load error:", err);
    error = "Не удалось загрузить статистику винрейтов.";
  }

  return (
    <WinratesClient
      champions={champions}
      latestStats={latestStats}
      historyItems={historyItems}
      error={error}
      updatedAt={updatedAt}
    />
  );
}
