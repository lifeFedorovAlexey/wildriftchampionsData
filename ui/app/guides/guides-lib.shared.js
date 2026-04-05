import { getStatsApiBaseUrl } from "../../lib/stats-api-origin.js";
import { fetchApiJson } from "../../lib/server-api.js";
import guideShared from "../../shared/guides-shared.js";

export { getStatsApiBaseUrl };

const { mapToLocalSlug, getGuideSlugAliases, toGuideLaneKey } = guideShared;

function normalizeGuidePayloadSlug(guide, requestedSlug) {
  if (!guide || typeof guide !== "object") return guide;

  const normalizedSlug = mapToLocalSlug(
    String(guide?.champion?.slug || requestedSlug || "").trim(),
  );

  return {
    ...guide,
    champion: guide.champion
      ? {
          ...guide.champion,
          slug: normalizedSlug || guide.champion.slug,
        }
      : guide.champion,
  };
}

function normalizeGuideSummaryItems(items = []) {
  const bySlug = new Map();

  for (const item of Array.isArray(items) ? items : []) {
    const normalizedSlug = mapToLocalSlug(String(item?.slug || "").trim());
    if (!normalizedSlug || bySlug.has(normalizedSlug)) continue;
    bySlug.set(normalizedSlug, {
      ...item,
      slug: normalizedSlug,
    });
  }

  return Array.from(bySlug.values());
}

export async function fetchGuideFromApi(slug) {
  for (const alias of getGuideSlugAliases(slug)) {
    try {
      const payload = await fetchApiJson(`/api/guides/${encodeURIComponent(alias)}?lang=ru_ru`, {
        fetchOptions: {
          cache: "no-store",
        },
        allowNotFound: true,
        fallback: null,
      });

      if (payload) {
        return normalizeGuidePayloadSlug(payload, slug);
      }
    } catch (error) {
      console.error("guide api fetch error", error);
    }
  }

  return null;
}

export async function fetchGuideSlugsFromApi() {
  try {
    const payload = await fetchApiJson("/api/guides?fields=slug", {
      fetchOptions: {
        next: { revalidate: 3600 * 24 * 7 },
      },
      fallback: [],
    });

    if (Array.isArray(payload)) {
      return Array.from(new Set(payload.map((item) => mapToLocalSlug(String(item || "").trim())).filter(Boolean)));
    }

    return Array.from(
      new Set(
        (payload.items || [])
          .map((item) => mapToLocalSlug(String(item?.slug || "").trim()))
          .filter(Boolean),
      ),
    );
  } catch (error) {
    console.error("guide slugs api fetch error", error);
    return [];
  }
}

export async function fetchChampionNamesFromApi() {
  try {
    const payload = await fetchApiJson("/api/champions?lang=ru_ru&fields=names", {
      fetchOptions: {
        next: { revalidate: 3600 * 24 * 7 },
      },
      fallback: [],
    });
    const items = Array.isArray(payload) ? payload : [];

    return items.reduce((acc, item) => {
      const slug = String(item?.slug || "").trim();
      const name = String(item?.name || "").trim();
      if (slug && name) {
        acc[slug] = name;
      }
      return acc;
    }, {});
  } catch (error) {
    console.error("champion names api fetch error", error);
    return {};
  }
}

export async function fetchChampionIndexFromApi() {
  try {
    const payload = await fetchApiJson("/api/champions?lang=ru_ru&fields=index", {
      fetchOptions: {
        next: { revalidate: 3600 * 24 * 7 },
      },
      fallback: [],
    });

    return Array.isArray(payload) ? payload : [];
  } catch (error) {
    console.error("champion index api fetch error", error);
    return [];
  }
}

export async function fetchGuideSummariesFromApi() {
  try {
    const payload = await fetchApiJson("/api/guides", {
      fetchOptions: {
        next: { revalidate: 3600 * 24 * 7 },
      },
      fallback: { items: [] },
    });
    return normalizeGuideSummaryItems(Array.isArray(payload?.items) ? payload.items : []);
  } catch (error) {
    console.error("guide summaries api fetch error", error);
    return [];
  }
}

export function toLaneKey(value) {
  return toGuideLaneKey(value);
}

export async function fetchTierlistBulk() {
  try {
    return await fetchApiJson("/api/tierlist-bulk?lang=ru_ru", {
      fetchOptions: {
        next: { revalidate: 60 },
      },
      fallback: null,
    });
  } catch (error) {
    console.error("guide tierlist-bulk error", error);
    return null;
  }
}

export function findTierLabelForChampion(
  bulk,
  championSlug,
  laneKey,
  rankKey = "diamondPlus",
) {
  if (!bulk || !laneKey) return null;

  const bucket = bulk.tiersByRankLane?.[`${rankKey}|${laneKey}`];
  if (!bucket?.tiers) return null;

  for (const [tierLabel, champions] of Object.entries(bucket.tiers)) {
    if (champions.some((champion) => champion.slug === championSlug)) {
      return tierLabel;
    }
  }

  return null;
}
