function buildSkinAssetKey(parts: Array<string | number | null | undefined>) {
  return parts
    .map((part) =>
      String(part || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    )
    .filter(Boolean)
    .join("-");
}

function buildProxyPath(assetKey: string, sourceUrl: string) {
  return `/wr-api/assets/${assetKey}?src=${encodeURIComponent(sourceUrl)}`;
}

export function normalizeSkinImageSrc(
  championSlug: string,
  skinName: string,
  sourceUrl?: string | null,
) {
  if (!sourceUrl) return null;
  if (sourceUrl.startsWith("/")) return sourceUrl;

  try {
    const url = new URL(sourceUrl);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return buildProxyPath(
        buildSkinAssetKey(["skin", championSlug, skinName, "image"]),
        sourceUrl,
      );
    }
  } catch {}

  return sourceUrl;
}

export function normalizeSkinModelSrc(
  championSlug: string,
  skinName: string,
  sourceUrl?: string | null,
) {
  if (!sourceUrl) return null;
  if (sourceUrl.startsWith("/")) return sourceUrl;

  try {
    const url = new URL(sourceUrl);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return buildProxyPath(
        buildSkinAssetKey(["skin", championSlug, skinName, "model"]),
        sourceUrl,
      );
    }
  } catch {}

  return sourceUrl;
}
