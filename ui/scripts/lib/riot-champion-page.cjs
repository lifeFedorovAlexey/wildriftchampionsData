/* eslint-disable @typescript-eslint/no-require-imports */
const https = require("node:https");
const {
  RIOT_CHAMPION_SLUG_ALIASES,
  repairGuideText,
} = require("../../shared/guides-shared.js");

const RIOT_ORIGIN = "https://wildrift.leagueoflegends.com";
const RIOT_CHAMPION_PAGE_LOCALES = ["ru-ru", "en-us"];

function warnSlugLookup({ service, requestedSlug, candidateSlug = "", source = "", status = "" }) {
  const parts = [
    "[slug-warn]",
    `service=${service}`,
    `requested=${String(requestedSlug || "").trim() || "-"}`,
  ];

  if (candidateSlug) {
    parts.push(`candidate=${String(candidateSlug).trim()}`);
  }
  if (source) {
    parts.push(`source=${source}`);
  }
  if (status) {
    parts.push(`status=${status}`);
  }

  console.warn(parts.join(" "));
}

function cleanText(value = "") {
  return repairGuideText(String(value || "")).replace(/\s+/g, " ").trim();
}

function slugify(value = "") {
  return cleanText(value)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function htmlToText(value = "") {
  return cleanText(
    String(value)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  );
}

function createHttpError({ source, statusCode, url, message }) {
  const error = new Error(message);
  error.source = source;
  error.statusCode = statusCode;
  error.url = url;
  return error;
}

function fetchRiotChampionPage(slug, requestedSlug = slug, locale = "ru-ru") {
  const url = `${RIOT_ORIGIN}/${locale}/champions/${slug}/`;
  const headers = {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "accept-language": "ru-RU,ru;q=0.9,en;q=0.8",
    "cache-control": "no-cache",
  };

  return new Promise((resolve, reject) => {
    https
      .get(url, { headers }, (res) => {
        let data = "";

        if (res.statusCode !== 200) {
          if (res.statusCode === 404) {
            warnSlugLookup({
              service: "ui/riot-champion-page",
              requestedSlug,
              candidateSlug: slug,
              source: `riot:${locale}`,
              status: "404",
            });
          }
          reject(
            createHttpError({
              source: "riot",
              statusCode: res.statusCode,
              url,
              message: `HTTP ${res.statusCode} for ${url}`,
            }),
          );
          res.resume();
          return;
        }

        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

async function fetchRiotChampionPageWithFallbacks(slug) {
  const candidates = Array.from(
    new Set([slug, ...(RIOT_CHAMPION_SLUG_ALIASES[slug] || [])].filter(Boolean)),
  );

  let lastError = null;
  for (const locale of RIOT_CHAMPION_PAGE_LOCALES) {
    for (const candidate of candidates) {
      try {
        const html = await fetchRiotChampionPage(candidate, slug, locale);
        return { html, resolvedSlug: candidate, resolvedLocale: locale };
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError;
}

function parseRiotChampionData(html, slug, locale = "ru-ru") {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (!match) {
    return null;
  }

  const payload = JSON.parse(match[1]);
  const page = payload?.props?.pageProps?.page;
  const blades = page?.blades || [];
  const masthead = blades.find((blade) => blade.type === "characterMasthead");
  const abilitiesBlade = blades.find((blade) => blade.type === "iconTab");
  const skinsBlade = blades.find((blade) => blade.type === "landingMediaCarousel");

  const roles = masthead?.role?.roles?.map((role) => role.name).filter(Boolean) || [];
  const abilities =
    abilitiesBlade?.groups?.map((group) => ({
      name: cleanText(group?.content?.title || group?.label || ""),
      slug: slugify(group?.content?.title || group?.label || ""),
      subtitle: cleanText(group?.content?.subtitle || ""),
      description: htmlToText(group?.content?.description?.body || ""),
      iconUrl: group?.thumbnail?.url || null,
      videoUrl: group?.content?.media?.sources?.[0]?.src || null,
    }))?.filter((ability) => ability.name) || [];
  const skins =
    skinsBlade?.groups?.map((group) => ({
      name: cleanText(group?.label || ""),
      slug: slugify(group?.label || ""),
      imageUrl: group?.thumbnail?.url || group?.content?.media?.url || null,
    }))?.filter((skin) => skin.name) || [];

  return {
    source: {
      site: "riot",
      locale,
      url: `${RIOT_ORIGIN}/${locale}/champions/${slug}/`,
    },
    champion: {
      name: cleanText(masthead?.title || page?.title || slug),
      title: cleanText(masthead?.subtitle || ""),
    },
    roleLabel: cleanText(masthead?.role?.label || ""),
    roles,
    difficultyLabel: cleanText(masthead?.difficulty?.label || ""),
    difficulty: cleanText(masthead?.difficulty?.name || ""),
    heroMedia: {
      remoteVideoUrl: masthead?.backdrop?.background?.sources?.[0]?.src || null,
      localVideoPath: null,
    },
    abilitiesLabel: cleanText(abilitiesBlade?.header?.title || ""),
    abilities,
    skinsLabel: cleanText(skinsBlade?.header?.title || ""),
    skins,
  };
}

module.exports = {
  RIOT_ORIGIN,
  fetchRiotChampionPage,
  fetchRiotChampionPageWithFallbacks,
  parseRiotChampionData,
  RIOT_CHAMPION_PAGE_LOCALES,
};
