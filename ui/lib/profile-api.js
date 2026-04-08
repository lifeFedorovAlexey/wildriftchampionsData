import { fetchApiJson } from "./server-api.js";

export async function fetchProfileChampionOptions(env = process.env) {
  const payload = await fetchApiJson("/api/champions?lang=ru_ru&fields=index", {
    env,
    fetchOptions: {
      next: { revalidate: 60 },
    },
    fallback: [],
  });

  return (Array.isArray(payload) ? payload : [])
    .map((item) => ({
      slug: String(item?.slug || "").trim(),
      name: String(item?.name || item?.localizedName || item?.slug || "").trim(),
      iconUrl: String(item?.iconUrl || "").trim(),
    }))
    .filter((item) => item.slug && item.name);
}
