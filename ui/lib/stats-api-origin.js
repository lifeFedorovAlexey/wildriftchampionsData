export const DEFAULT_STATS_API_ORIGIN = "http://127.0.0.1:3001";

export function isPublicSnapshotPath(pathname) {
  const path = String(pathname || "").split(/[?#]/, 1)[0];
  return /^\/api\/(?:champions|updated-at|latest-stats-snapshot|winrates-snapshot|champion-history|tierlist-bulk|tierlist|trend-events)\/?$/.test(path) ||
    /^\/api\/(?:guides|patch-notes)(?:\/[^/]+)?\/?$/.test(path);
}

export function getStatsApiBaseUrl(
  env = process.env,
  { extraKeys = [] } = {},
) {
  if (String(env?.PUBLIC_DATA_MODE || "").trim().toLowerCase() === "snapshot") {
    return String(
      env?.PUBLIC_DATA_ORIGIN || "http://127.0.0.1:3000/public-data",
    ).replace(/\/+$/, "");
  }

  return getBackendApiBaseUrl(env, { extraKeys });
}

export function getBackendApiBaseUrl(env = process.env, { extraKeys = [] } = {}) {
  const keys = [
    ...extraKeys,
    "API_PROXY_TARGET",
    "NEXT_PUBLIC_STATS_API_ORIGIN",
    "STATS_API_ORIGIN",
    "NEXT_PUBLIC_API_ORIGIN",
    "API_ORIGIN",
  ];

  for (const key of keys) {
    const value = env?.[key];
    if (value) {
      return String(value).replace(/\/+$/, "");
    }
  }

  return DEFAULT_STATS_API_ORIGIN;
}
