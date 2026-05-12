import { buildApiUrl, fetchApiJson } from "./server-api.js";

export type StreamerTierChampion = {
  slug: string;
  name: string;
  iconUrl?: string | null;
  roles?: string[];
};

export type StreamerTierKey = "S+" | "S" | "A" | "B" | "C" | "D";
export type StreamerLaneKey = "top" | "jungle" | "mid" | "adc" | "support";

export type StreamerPublicationPayload = {
  version: number;
  tiersOrder: StreamerTierKey[];
  lanes: Record<
    StreamerLaneKey,
    {
      lane: StreamerLaneKey;
      tiers: Record<StreamerTierKey, StreamerTierChampion[]>;
    }
  >;
};

export type StreamerPublication = {
  id: number;
  siteUserId: number;
  sourceStatsSnapshotId?: number | null;
  sourceStatsDate?: string | null;
  editedAt: string | null;
  publishedAt: string | null;
  payload: StreamerPublicationPayload;
};

export type StreamerProfile = {
  id: number;
  displayName: string;
  avatarUrl?: string | null;
  wildRiftHandle?: string | null;
};

export type StreamerPublicationHistoryItem = {
  id: number;
  sourceStatsSnapshotId?: number | null;
  sourceStatsDate?: string | null;
  editedAt: string | null;
  publishedAt: string | null;
};

export type StreamerChampionOption = {
  slug: string;
  name: string;
  iconUrl?: string | null;
  roles: string[];
};

export type StreamerTierlistEditorPayload = {
  streamer: StreamerProfile;
  sourceSnapshot?: {
    id: number;
    statsDate?: string | null;
    completedAt?: string | null;
  } | null;
  tiersOrder: StreamerTierKey[];
  laneKeys: StreamerLaneKey[];
  champions: StreamerChampionOption[];
  metaChampionSlugsByLane: Record<StreamerLaneKey, string[]>;
  currentPublication?: StreamerPublication | null;
  history: StreamerPublicationHistoryItem[];
};

export type StreamerTierlistIndexPayload = {
  streamers: Array<{
    streamer: StreamerProfile;
    currentPublication: StreamerPublicationHistoryItem;
  }>;
};

export type StreamerTierlistDetailPayload = {
  streamer: StreamerProfile;
  currentPublication: StreamerPublication;
  history: StreamerPublicationHistoryItem[];
};

export async function fetchPublicStreamerTierlists(env = process.env) {
  return await fetchApiJson("/api/streamer-tierlists", {
    env,
    fetchOptions: {
      next: { revalidate: 300 },
    },
    fallback: { streamers: [] },
  });
}

export async function fetchPublicStreamerTierlist(
  siteUserId: number | string,
  env = process.env,
) {
  const query = new URLSearchParams({
    siteUserId: String(siteUserId),
  });

  return await fetchApiJson(`/api/streamer-tierlists?${query.toString()}`, {
    env,
    fetchOptions: {
      cache: "no-store",
    },
    allowNotFound: true,
    fallback: null,
  });
}

export async function fetchAuthenticatedStreamerTierlistEditor(
  sessionToken: string,
  env = process.env,
): Promise<StreamerTierlistEditorPayload> {
  const response = await fetch(buildApiUrl("/api/user/streamer-tierlists", env), {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || "streamer_tierlist_editor_failed");
  }

  return payload;
}
