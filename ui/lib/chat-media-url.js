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
