export const DEFAULT_STATS_API_ORIGIN = "http://127.0.0.1:3001";

export function getStatsApiBaseUrl(
  env = process.env,
  { extraKeys = [] } = {},
) {
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
