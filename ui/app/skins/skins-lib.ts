import { getStatsApiBaseUrl } from "@/lib/stats-api-origin.js";

export type SkinImage = {
  preview: string | null;
  full: string | null;
};

export type SkinModel = {
  cdn: string | null;
  local: string | null;
};

export type Skin = {
  name: string;
  image: SkinImage;
  has3d: boolean;
  model: SkinModel | null;
};

export type ChampionSkinsData = {
  slug: string;
  skinCount: number;
  with3d: number;
  skins: Skin[];
};

type SkinsListResponse = {
  count: number;
  items: ChampionSkinsData[];
};

async function fetchJson(pathname: string) {
  const baseUrl = getStatsApiBaseUrl(process.env);
  const response = await fetch(`${baseUrl}${pathname}`, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${pathname}`);
  }

  return response.json();
}

export async function fetchSkinsListFromApi(): Promise<ChampionSkinsData[]> {
  try {
    const payload = (await fetchJson("/api/skins")) as SkinsListResponse;
    return Array.isArray(payload?.items) ? payload.items : [];
  } catch {
    return [];
  }
}

export async function fetchSkinDetailFromApi(slug: string): Promise<ChampionSkinsData | null> {
  try {
    return (await fetchJson(`/api/skins/${encodeURIComponent(slug)}`)) as ChampionSkinsData;
  } catch {
    return null;
  }
}
