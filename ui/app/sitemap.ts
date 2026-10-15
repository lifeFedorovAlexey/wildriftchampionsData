import type { MetadataRoute } from "next";

import { fetchGuideSlugsFromApi } from "./guides/guides-lib";
import { fetchPatchNotes } from "./patch-notes/patch-notes-lib";

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
  { path: "/guides", changeFrequency: "weekly", priority: 0.8 },
  { path: "/patch-notes", changeFrequency: "daily", priority: 0.8 },
  { path: "/support", changeFrequency: "monthly", priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [guideSlugs, patchNotes] = await Promise.all([
    fetchGuideSlugsFromApi(),
    fetchPatchNotes(),
  ]);

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

  const patchEntries: MetadataRoute.Sitemap = patchNotes.map((patch) => ({
    url: `${SITE_URL}/patch-notes/${encodeURIComponent(patch.version)}`,
    lastModified: patch.publishedAt ? new Date(patch.publishedAt) : now,
    changeFrequency: "monthly",
    priority: 0.65,
  }));

  return [...staticEntries, ...guideEntries, ...patchEntries];
}
