import type {
  StreamerBoardKey,
  StreamerPublication,
  StreamerTierKey,
} from "@/lib/streamer-tierlists-api";

type StreamerLaneKey = StreamerBoardKey;

export const STREAMER_LANE_LABELS: Record<StreamerLaneKey, string> = {
  overall: "Общий",
  top: "Топ",
  jungle: "Лес",
  mid: "Мид",
  adc: "АДК",
  support: "Саппорт",
};

export type StreamerDraftLayout = Record<
  StreamerLaneKey,
  Record<StreamerTierKey, string[]>
>;

export function createEmptyDraft(
  laneKeys: StreamerLaneKey[],
  tiersOrder: StreamerTierKey[],
): StreamerDraftLayout {
  const draft = {} as StreamerDraftLayout;

  for (const lane of laneKeys) {
    const laneDraft = {} as Record<StreamerTierKey, string[]>;

    for (const tier of tiersOrder) {
      laneDraft[tier] = [];
    }

    draft[lane] = laneDraft;
  }

  return draft;
}

export function buildDraftFromPublication(
  publication: StreamerPublication | null | undefined,
  laneKeys: StreamerLaneKey[],
  tiersOrder: StreamerTierKey[],
): StreamerDraftLayout {
  const draft = createEmptyDraft(laneKeys, tiersOrder);
  if (!publication?.payload?.lanes) {
    return draft;
  }

  for (const lane of laneKeys) {
    const lanePayload = publication.payload.lanes[lane];
    if (!lanePayload?.tiers) continue;

    for (const tier of tiersOrder) {
      const entries = Array.isArray(lanePayload.tiers[tier])
        ? lanePayload.tiers[tier]
        : [];

      draft[lane][tier] = entries
        .map((champion) => String(champion?.slug || "").trim().toLowerCase())
        .filter(Boolean);
    }
  }

  return draft;
}

export function getAssignedSlugsForLane(
  draft: StreamerDraftLayout,
  lane: StreamerLaneKey,
  tiersOrder: StreamerTierKey[],
) {
  return new Set(
    tiersOrder.flatMap((tier) => draft[lane]?.[tier] || []),
  );
}

export function countAssignedForLane(
  draft: StreamerDraftLayout,
  lane: StreamerLaneKey,
  tiersOrder: StreamerTierKey[],
) {
  return tiersOrder.reduce((count, tier) => count + (draft[lane]?.[tier]?.length || 0), 0);
}

export function moveChampionInDraft(
  draft: StreamerDraftLayout,
  lane: StreamerLaneKey,
  slug: string,
  targetTier: StreamerTierKey | null,
  tiersOrder: StreamerTierKey[],
  options: { beforeSlug?: string | null } = {},
): StreamerDraftLayout {
  const normalizedSlug = String(slug || "").trim().toLowerCase();
  if (!normalizedSlug) return draft;
  const normalizedBeforeSlug = String(options.beforeSlug || "").trim().toLowerCase();

  const nextLane = Object.fromEntries(
    tiersOrder.map((tier) => [
      tier,
      (draft[lane]?.[tier] || []).filter((value) => value !== normalizedSlug),
    ]),
  ) as Record<StreamerTierKey, string[]>;

  if (targetTier) {
    const nextTierEntries = [...nextLane[targetTier]];
    const insertIndex = normalizedBeforeSlug
      ? nextTierEntries.findIndex((value) => value === normalizedBeforeSlug)
      : -1;

    if (insertIndex >= 0) {
      nextTierEntries.splice(insertIndex, 0, normalizedSlug);
    } else {
      nextTierEntries.push(normalizedSlug);
    }

    nextLane[targetTier] = nextTierEntries;
  }

  return {
    ...draft,
    [lane]: nextLane,
  };
}

export function clearTierInDraft(
  draft: StreamerDraftLayout,
  lane: StreamerLaneKey,
  tier: StreamerTierKey,
): StreamerDraftLayout {
  return {
    ...draft,
    [lane]: {
      ...draft[lane],
      [tier]: [],
    },
  };
}
