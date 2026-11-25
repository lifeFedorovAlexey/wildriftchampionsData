const TRUSTED_AVATAR_HOST_SUFFIXES = Object.freeze([
  "googleusercontent.com",
  "yandex.net",
  "userapi.com",
  "t.me",
  "telegram.org",
]);

function isHostWithin(hostname, suffix) {
  return hostname === suffix || hostname.endsWith(`.${suffix}`);
}

const LOCAL_STORAGE_ORIGIN = "http://127.0.0.1:3390";
const TRUSTED_SOURCE_HOSTS = Object.freeze([
  "leagueoflegends.com",
  "www.leagueoflegends.com",
  "wildrift.leagueoflegends.com",
]);

export function sanitizeChatSourceUrl(value) {
  const raw = String(value || "").trim();
  if (raw === "/winrates") return "/winrates";
  const guide = /^\/guides\/([a-z0-9-]+)$/.exec(raw);
  if (guide) return `/guides/${guide[1]}`;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return "";
    const host = TRUSTED_SOURCE_HOSTS.find(allowed => allowed === url.hostname);
    if (!host) return "";
    // Render a URL rebuilt from an allowlisted host and a fixed HTTPS scheme.
    return `https://${host}${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "";
  }
}

export function normalizeChatStorageOrigin(value, { allowLocalStorage = false } = {}) {
  try {
    const url = new URL(String(value || "").trim());
    if (url.username || url.password) return "";
    return url.protocol === "https:" || (allowLocalStorage && url.origin === LOCAL_STORAGE_ORIGIN) ? url.origin : "";
  } catch {
    return "";
  }
}

export function sanitizeChatMediaUrl(value, { storageOrigin = "", allowLocalStorage = false } = {}) {
  try {
    const url = new URL(String(value || "").trim());
    const localObject = allowLocalStorage && url.origin === LOCAL_STORAGE_ORIGIN && url.pathname.startsWith("/wildrift-dev/");
    if ((url.protocol !== "https:" && !localObject) || url.username || url.password) return "";

    const normalizedStorageOrigin = normalizeChatStorageOrigin(storageOrigin, { allowLocalStorage });
    const trustedStorage =
      normalizedStorageOrigin && url.origin === normalizedStorageOrigin;
    const trustedAvatar = TRUSTED_AVATAR_HOST_SUFFIXES.some((suffix) =>
      isHostWithin(url.hostname, suffix),
    );

    return trustedStorage || trustedAvatar ? url.href : "";
  } catch {
    return "";
  }
}
