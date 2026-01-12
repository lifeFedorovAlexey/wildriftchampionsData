import WinratesClient from "./WinratesClient";

const API_PREFIX = "/wr-api";
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

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return (await res.json()) as T;
}

function buildLatestMap(items: HistoryItem[]) {
  const latestMap: Record<string, HistoryItem> = {};
  for (const item of items) {
    if (!item?.slug || !item?.rank || !item?.lane || !item?.date) continue;
    const key = `${item.slug}|${item.rank}|${item.lane}`;
    const prev = latestMap[key];
    if (!prev || String(item.date) > String(prev.date)) {
      latestMap[key] = item;
    }
  }
  return latestMap;
}

function getBaseUrlFromEnv() {
  const env =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (!env) return "http://localhost:3000";

  return env.startsWith("http") ? env : `https://${env}`;
}

export default async function Page() {
  let champions: Champion[] = [];
  let latestStats: Record<string, HistoryItem> | null = null;
  let error: string | null = null;

  try {
    const baseUrl = getBaseUrlFromEnv();

    const champsUrl = `${baseUrl}${API_PREFIX}/api/champions?lang=${encodeURIComponent(
      language
    )}`;
    const histUrl = `${baseUrl}${API_PREFIX}/api/champion-history`;

    const [champsJson, histJson] = await Promise.all([
      fetchJson<Champion[]>(champsUrl),
      fetchJson<{ items?: HistoryItem[] }>(histUrl),
    ]);

    champions = Array.isArray(champsJson) ? champsJson : [];
    const items = Array.isArray(histJson.items) ? histJson.items : [];
    latestStats = buildLatestMap(items);
  } catch (e) {
    console.error("Winrates load error:", e);
    error = "Не удалось загрузить статистику винрейтов.";
  }

  return (
    <WinratesClient
      language={language}
      champions={champions}
      latestStats={latestStats}
      error={error}
    />
  );
}
