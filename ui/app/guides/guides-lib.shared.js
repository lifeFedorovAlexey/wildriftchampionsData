import { getStatsApiBaseUrl } from "../../lib/stats-api-origin.js";
import { fetchApiJson } from "../../lib/server-api.js";

export { getStatsApiBaseUrl };

export async function fetchGuideFromApi(slug) {
  try {
    return await fetchApiJson(`/api/guides/${encodeURIComponent(slug)}?lang=ru_ru`, {
      fetchOptions: {
        cache: "no-store",
      },
      allowNotFound: true,
      fallback: null,
    });
  } catch (error) {
    console.error("guide api fetch error", error);
    return null;
  }
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
      return payload.filter(Boolean);
    }

    return (payload.items || [])
      .map((item) => String(item?.slug || "").trim())
      .filter(Boolean);
  } catch (error) {
    console.error("guide slugs api fetch error", error);
    return [];
  }
}

export async function fetchChampionNamesFromApi() {
  try {
    const payload = await fetchApiJson("/api/champions?lang=ru_ru", {
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

export async function fetchGuideSummariesFromApi() {
  try {
    const payload = await fetchApiJson("/api/guides", {
      fetchOptions: {
        next: { revalidate: 3600 * 24 * 7 },
      },
      fallback: { items: [] },
    });
    return Array.isArray(payload?.items) ? payload.items : [];
  } catch (error) {
    console.error("guide summaries api fetch error", error);
    return [];
  }
}

export function toLaneKey(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized.includes("support") || normalized.includes("саппорт")) {
    return "support";
  }

  if (normalized.includes("mid") || normalized.includes("мид")) {
    return "mid";
  }

  if (normalized.includes("jungle") || normalized.includes("лес")) {
    return "jungle";
  }

  if (
    normalized.includes("baron") ||
    normalized.includes("барон") ||
    normalized.includes("топ")
  ) {
    return "top";
  }

  if (
    normalized.includes("duo") ||
    normalized.includes("adc") ||
    normalized.includes("адк")
  ) {
    return "adc";
  }

  return null;
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
