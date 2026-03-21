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

    historyItems = Array.isArray(histJson.items) ? histJson.items : [];
    latestStats = buildLatestMap(historyItems);
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
