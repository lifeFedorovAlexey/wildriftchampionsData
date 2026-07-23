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

export function normalizeChatStorageOrigin(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "https:" ? url.origin : "";
  } catch {
    return "";
  }
}

export function sanitizeChatMediaUrl(value, { storageOrigin = "" } = {}) {
  try {
    const url = new URL(String(value || "").trim());
    if (url.protocol !== "https:" || url.username || url.password) return "";

    const normalizedStorageOrigin = normalizeChatStorageOrigin(storageOrigin);
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
