import { fetchApiJson } from "@/lib/server-api.js";

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

export async function fetchSkinsListFromApi(): Promise<ChampionSkinsData[]> {
  try {
    const payload = (await fetchApiJson("/api/skins", {
      fetchOptions: { next: { revalidate: 3600 } },
      fallback: { items: [] },
    })) as SkinsListResponse;
    return Array.isArray(payload?.items) ? payload.items : [];
  } catch {
    return [];
  }
}

export async function fetchSkinDetailFromApi(slug: string): Promise<ChampionSkinsData | null> {
  try {
    return (await fetchApiJson(`/api/skins/${encodeURIComponent(slug)}`, {
      fetchOptions: { next: { revalidate: 3600 } },
      allowNotFound: true,
      fallback: null,
    })) as ChampionSkinsData | null;
  } catch {
    return null;
  }
}
