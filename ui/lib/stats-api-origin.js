export const DEFAULT_STATS_API_ORIGIN = "http://127.0.0.1:3001";

export function getStatsApiBaseUrl(
  env = process.env,
  { extraKeys = [] } = {},
) {
  if (String(env?.PUBLIC_DATA_MODE || "").trim().toLowerCase() === "snapshot") {
    return String(
      env?.PUBLIC_DATA_ORIGIN || "http://127.0.0.1:3000/public-data",
    ).replace(/\/+$/, "");
  }

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
