import { getStatsApiBaseUrl } from "../../lib/stats-api-origin.js";
import { buildApiUrl, fetchApiJson } from "../../lib/server-api.js";
import guideShared from "../../shared/guides-shared.js";

export { getStatsApiBaseUrl };

const { mapToLocalSlug, getGuideSlugAliases, toGuideLaneKey } = guideShared;

function warnSlugLookup({ service, requestedSlug, candidateSlug = "", source = "", status = "" }) {
  const parts = [
    "[slug-warn]",
    `service=${service}`,
    `requested=${String(requestedSlug || "").trim() || "-"}`,
  ];

  if (candidateSlug) {
    parts.push(`candidate=${String(candidateSlug).trim()}`);
  }
  if (source) {
    parts.push(`source=${source}`);
  }
  if (status) {
    parts.push(`status=${status}`);
  }

  console.warn(parts.join(" "));
}

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
      const pathname = `/api/guides/${encodeURIComponent(alias)}?lang=ru_ru`;
      const response = await fetch(buildApiUrl(pathname), { cache: "no-store" });

      if (response.status === 404) {
        warnSlugLookup({
          service: "ui/guides-lib",
          requestedSlug: slug,
          candidateSlug: alias,
          source: "wr-api",
          status: "404",
        });
        continue;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${pathname}`);
      }

      const payload = await response.json();

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
        next: { revalidate: 60 },
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
        next: { revalidate: 60 },
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

const DEFAULT_GUIDE_LANE_KEYS = ["top", "jungle", "mid", "adc", "support"];

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

export function buildChampionLaneMap(tierlistBulk, laneKeys = DEFAULT_GUIDE_LANE_KEYS) {
  const laneMap = new Map();

  for (const laneKey of laneKeys) {
    const buckets = Object.entries(tierlistBulk?.tiersByRankLane || {})
      .filter(([sliceKey]) => sliceKey.endsWith(`|${laneKey}`))
      .map(([, bucket]) => bucket);

    for (const bucket of buckets) {
      for (const champions of Object.values(bucket?.tiers || {})) {
        for (const champion of Array.isArray(champions) ? champions : []) {
          const slug = String(champion?.slug || "").trim();
          if (!slug) continue;

          const current = laneMap.get(slug) || new Set();
          current.add(laneKey);
          laneMap.set(slug, current);
        }
      }
    }
  }

  return laneMap;
}

export function hydrateGuideIndexItems(guideItems = [], championIndex = [], tierlistBulk = null) {
  const guideItemsBySlug = new Map(guideItems.map((item) => [item.slug, item]));
  const championLaneMap = buildChampionLaneMap(tierlistBulk);

  return championIndex.map((champion) => {
    const guide = guideItemsBySlug.get(champion.slug);
    const laneKeys =
      Array.isArray(guide?.availableLanes) && guide.availableLanes.length
        ? Array.from(new Set(guide.availableLanes))
        : Array.from(championLaneMap.get(champion.slug) || []);

    if (guide) {
      return {
        ...guide,
        localizedName: champion.name || guide.name || null,
        iconUrl: champion.iconUrl || guide.iconUrl || null,
        roles: guide.roles?.length ? guide.roles : champion.roles || [],
        laneKeys,
        hasGuide: true,
      };
    }

    return {
      slug: champion.slug,
      name: champion.name || champion.slug,
      localizedName: champion.name || null,
      hasGuide: false,
      title: "Гайд скоро",
      iconUrl: champion.iconUrl || null,
      patch: null,
      tier: null,
      recommendedRole: null,
      roles: champion.roles || [],
      laneKeys,
      buildCount: 0,
      updatedAt: null,
    };
  });
}
