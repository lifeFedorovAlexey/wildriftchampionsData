import { getBackendApiBaseUrl, getStatsApiBaseUrl, isPublicSnapshotPath } from "./stats-api-origin.js";

export function buildApiUrl(pathname, env = process.env) {
  const baseUrl = isPublicSnapshotPath(pathname) ? getStatsApiBaseUrl(env) : getBackendApiBaseUrl(env);
  return `${baseUrl}${pathname}`;
}

export async function fetchApiJson(pathname, options = {}) {
  const {
    env = process.env,
    fetchOptions = undefined,
    allowNotFound = false,
    fallback = undefined,
  } = options;

  try {
    const response = await fetch(buildApiUrl(pathname, env), fetchOptions);

    if (allowNotFound && response.status === 404) {
      return fallback;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${pathname}`);
    }

    return await response.json();
  } catch (error) {
    if (fallback !== undefined) {
      return fallback;
    }

    throw error;
  }
}
