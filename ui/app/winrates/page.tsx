import { headers } from "next/headers";
import WinratesClient from "./WinratesClient";

const API_PREFIX = "/wr-api";
const language = "ru_ru";

// Если хочешь другое поведение кэша — поменяй revalidate
const revalidate = 60;

type RankKey = "diamondPlus" | "masterPlus" | "king" | "peak";
type LaneKey = "top" | "jungle" | "mid" | "adc" | "support";

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

function getBaseUrlFromHeaders(h: Headers) {
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";

  if (!host) {
    // fallback для локалки/нестандартных прокси
    const env =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      process.env.VERCEL_URL;

    if (env) {
      const withProto = env.startsWith("http") ? env : `https://${env}`;
      return withProto;
    }

    // последний шанс
    return "http://localhost:3000";
  }

  return `${proto}://${host}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    next: { revalidate },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }

  return (await res.json()) as T;
}

function buildLatestMap(items: HistoryItem[]) {
  const latestMap: Record<string, HistoryItem> = {};

  for (const item of items) {
    if (!item?.slug || !item?.rank || !item?.lane || !item?.date) continue;

    const key = `${item.slug}|${item.rank}|${item.lane}`;
    const prev = latestMap[key];

    if (!prev) latestMap[key] = item;
    else if (String(item.date) > String(prev.date)) latestMap[key] = item;
  }

  return latestMap;
}

export default async function Page() {
  let champions: Champion[] = [];
  let latestStats: Record<string, HistoryItem> | null = null;
  let error: string | null = null;

  try {
    const h = await headers();
    const baseUrl = getBaseUrlFromHeaders(h);

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
