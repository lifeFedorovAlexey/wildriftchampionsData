import { fetchApiJson } from "@/lib/server-api.js";

export type NewsListItem = {
  id: number;
  sourceUrl: string;
  normalizedUrl?: string | null;
  title: string | null;
  description?: string | null;
  category?: string | null;
  locale?: string | null;
  publishedAt?: string | null;
  patchVersion?: string | null;
  patchPublishedAt?: string | null;
  pageType?: string | null;
  bannerImageUrl?: string | null;
  counts: {
    events: number;
    itemChanges: number;
    skins: number;
    newChampions: number;
    championChanges: number;
  };
  eventsPreview: Array<{
    id: number;
    date?: string | null;
    championSlug?: string | null;
    type?: string | null;
    scope?: string | null;
    title?: string | null;
    summary?: string | null;
  }>;
};

export type NewsDetail = {
  article: {
    id: number;
    sourceUrl: string;
    normalizedUrl?: string | null;
    title: string | null;
    description?: string | null;
    category?: string | null;
    locale?: string | null;
    publishedAt?: string | null;
    contentId?: string | null;
    bodyText?: string | null;
    patchVersion?: string | null;
    patchPublishedAt?: string | null;
    counts: {
      events: number;
      itemChanges: number;
      skins: number;
      newChampions: number;
      championChanges: number;
    };
    rawPayload?: {
      bannerImageUrl?: string | null;
      pageType?: string | null;
      itemChanges?: Array<{
        name?: string | null;
        summary?: string | null;
        changes?: string[];
        bodyText?: string | null;
      }>;
      skins?: Array<{
        name?: string | null;
        availabilityText?: string | null;
        availableAt?: string | null;
        imageUrl?: string | null;
      }>;
      newChampions?: Array<{
        name?: string | null;
        summary?: string | null;
        availabilityText?: string | null;
        availableAt?: string | null;
        bodyText?: string | null;
      }>;
    };
  };
  events: Array<{
    id: number;
    date?: string | null;
    championSlug?: string | null;
    type?: string | null;
    scope?: string | null;
    abilityName?: string | null;
    skinName?: string | null;
    title?: string | null;
    summary?: string | null;
    details?: Record<string, unknown> | null;
    confidence?: number | null;
    sourceMethod?: string | null;
  }>;
};

export async function fetchNewsListFromApi(limit = 24): Promise<NewsListItem[]> {
  try {
    const payload = await fetchApiJson(`/api/news?limit=${encodeURIComponent(String(limit))}`, {
      fetchOptions: {
        next: { revalidate: 300 },
      },
      fallback: { items: [] },
    });
    return Array.isArray(payload?.items) ? payload.items : [];
  } catch (error) {
    console.error("news list api fetch error", error);
    return [];
  }
}

export async function fetchNewsDetailFromApi(id: string): Promise<NewsDetail | null> {
  try {
    return (await fetchApiJson(`/api/news/${encodeURIComponent(id)}`, {
      fetchOptions: {
        next: { revalidate: 300 },
      },
      allowNotFound: true,
      fallback: null,
    })) as NewsDetail | null;
  } catch (error) {
    console.error("news detail api fetch error", error);
    return null;
  }
}
