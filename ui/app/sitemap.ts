import type { MetadataRoute } from "next";
import fs from "node:fs/promises";
import path from "node:path";

import { fetchGuideSlugsFromApi } from "./guides/guides-lib";

const SITE_URL = "https://wildriftallstats.ru";

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/winrates", changeFrequency: "daily", priority: 0.9 },
  { path: "/tierlist", changeFrequency: "daily", priority: 0.9 },
  { path: "/tier-inq", changeFrequency: "daily", priority: 0.8 },
  { path: "/picks-bans", changeFrequency: "daily", priority: 0.8 },
  { path: "/trends", changeFrequency: "daily", priority: 0.8 },
  { path: "/skins", changeFrequency: "weekly", priority: 0.75 },
  { path: "/guides", changeFrequency: "weekly", priority: 0.8 },
];

async function getSkinSlugs() {
  try {
    const indexPath = path.join(process.cwd(), "public", "merged", "index.json");
    const raw = await fs.readFile(indexPath, "utf8");
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed)
      ? parsed.map((slug) => String(slug || "").trim()).filter(Boolean)
      : [];
  } catch (error) {
    console.error("sitemap skins index read error", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [guideSlugs, skinSlugs] = await Promise.all([fetchGuideSlugsFromApi(), getSkinSlugs()]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const guideEntries: MetadataRoute.Sitemap = guideSlugs.map((slug) => ({
    url: `${SITE_URL}/guides/${encodeURIComponent(slug)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const skinEntries: MetadataRoute.Sitemap = skinSlugs.map((slug) => ({
    url: `${SITE_URL}/skins/${encodeURIComponent(slug)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.65,
  }));

  return [...staticEntries, ...guideEntries, ...skinEntries];
}
