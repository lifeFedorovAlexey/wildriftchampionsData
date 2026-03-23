export function isExternalHttpAssetUrl(value?: string | null) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function ensureLocalAssetSrc(scope: string, value?: string | null) {
  if (
    process.env.NODE_ENV !== "production" &&
    isExternalHttpAssetUrl(value)
  ) {
    console.warn(`[asset-safety] external asset in ${scope}: ${value}`);
  }

  return value || null;
}
