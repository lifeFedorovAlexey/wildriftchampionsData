import { getStatsApiBaseUrl } from "../guides/guides-lib.shared.js";

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
    const baseUrl = getStatsApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/news?limit=${encodeURIComponent(String(limit))}`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    return Array.isArray(payload?.items) ? payload.items : [];
  } catch (error) {
    console.error("news list api fetch error", error);
    return [];
  }
}

export async function fetchNewsDetailFromApi(id: string): Promise<NewsDetail | null> {
  try {
    const baseUrl = getStatsApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/news/${encodeURIComponent(id)}`, {
      next: { revalidate: 300 },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as NewsDetail;
  } catch (error) {
    console.error("news detail api fetch error", error);
    return null;
  }
}
