/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const https = require("node:https");
const cheerio = require("cheerio");
const {
  WILDRIFTFIRE_GUIDE_SLUG_ALIASES,
  repairGuideText,
} = require("../shared/guides-shared.js");
const {
  fetchRiotChampionPageWithFallbacks,
  parseRiotChampionData,
} = require("./lib/riot-champion-page.js");

const SITE_ORIGIN = "https://www.wildriftfire.com";
const OUTPUT_ROOT = path.join(
  __dirname,
  "..",
  "data",
  "wildriftfire",
  "guides",
);

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

function createHttpError({ source, statusCode, url, message }) {
  const error = new Error(message);
  error.source = source;
  error.statusCode = statusCode;
  error.url = url;
  return error;
}

function fetchHtml(url, context = {}) {
  const headers = {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "no-cache",
  };

  return new Promise((resolve, reject) => {
    https
      .get(url, { headers }, (res) => {
        let data = "";

        if (res.statusCode !== 200) {
          if (res.statusCode === 404) {
            warnSlugLookup({
              service: "ui/parse-wildriftfire-guide",
              requestedSlug: context.requestedSlug,
              candidateSlug: context.candidateSlug,
              source: context.source || "wildriftfire",
              status: "404",
            });
          }
          reject(
            createHttpError({
              source: context.source || "wildriftfire",
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

function fetchTooltipHtml(relationType, relationId) {
  const url = `${SITE_ORIGIN}/ajax/tooltip?relation_type=${encodeURIComponent(relationType)}&relation_id=${encodeURIComponent(relationId)}`;
  const headers = {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "accept-language": "en-US,en;q=0.9",
    "x-requested-with": "XMLHttpRequest",
  };

  return new Promise((resolve, reject) => {
    https
      .get(url, { headers }, (res) => {
        let data = "";

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
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

function sha1(value) {
  return crypto.createHash("sha1").update(value).digest("hex");
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

function toAbsoluteUrl(value = "") {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return `${SITE_ORIGIN}${value}`;
  return `${SITE_ORIGIN}/${value.replace(/^\/+/, "")}`;
}

function resolveWildRiftFireGuideUrl(slug) {
  const guideSlug = WILDRIFTFIRE_GUIDE_SLUG_ALIASES[slug] || slug;
  return `${SITE_ORIGIN}/guide/${guideSlug}`;
}

function parseTooltipMeta(value = "") {
  const idMatch = value.match(/i:\s*['"]?(\d+)/);
  const kindMatch = value.match(/t:\s*['"]?([A-Za-z]+)/);

  return {
    id: idMatch ? Number(idMatch[1]) : null,
    kind: kindMatch ? kindMatch[1] : null,
  };
}

function getEntityName($, $holder) {
  const named = cleanText($holder.children(".name").first().text());
  if (named) return named;

  const directTextChildren = [];
  $holder.children().each((_, child) => {
    const text = cleanText($(child).text());
    if (text) {
      directTextChildren.push(text);
    }
  });

  return directTextChildren[directTextChildren.length - 1] || null;
}

function parseEntityHolder($, holder, fallbackType) {
  const $holder = $(holder);
  const tooltipNode = $holder.find(".ajax-tooltip").first();
  const tooltipMeta = parseTooltipMeta(
    tooltipNode.attr("class") || tooltipNode.attr("data-tooltip") || "",
  );
  const imageNode = $holder.find("img").not(".lane").first();
  const name = getEntityName($, $holder) || cleanText(imageNode.attr("alt") || "");

  if (!name) return null;

  return {
    id: tooltipMeta.id,
    kind: tooltipMeta.kind || fallbackType,
    name,
    slug: slugify(name),
    imageUrl: toAbsoluteUrl(imageNode.attr("src") || ""),
    imageAlt: imageNode.attr("alt") || name,
  };
}

function parseEntityList($, container, fallbackType) {
  const $container = typeof container === "string" ? $(container).first() : container;

  return $container
    .children(".ico-holder")
    .toArray()
    .map((holder) => parseEntityHolder($, holder, fallbackType))
    .filter(Boolean);
}

function parseInfoMap($) {
  const info = {};

  $(".additional-info > div").each((_, element) => {
    const title = cleanText($(element).find(".title").first().text());
    const value = cleanText($(element).find(".data").first().text());
    if (title) {
      info[title] = value;
    }
  });

  return info;
}

function parseSituationalSections($, rootSelector, fallbackType) {
  const $root =
    typeof rootSelector === "string" ? $(rootSelector).first() : $(rootSelector).first();

  return $root
    .find(".section.situation")
    .toArray()
    .map((section) => {
      const $section = $(section);
      const label = cleanText($section.find(".situation").first().text());
      const options = parseEntityList($, $section.find(".items-wrap").first(), fallbackType);

      if (!label || !options.length) return null;

      return { label, options };
    })
    .filter(Boolean);
}

function parseSkillOrder($, rootSelector = ".wf-champion__data__skills") {
  const root =
    typeof rootSelector === "string" ? $(rootSelector).first() : $(rootSelector).first();
  const quickOrder = parseEntityList($, root.find(".skills-mod__quick__order").first(), "Ability");

  const rows = root
    .find('.skills-mod__abilities__row:not(.skills-mod__abilities__row--passive)')
    .toArray()
    .map((row) => {
      const $row = $(row);
      const name = cleanText($row.children("span").first().text());
      const levels = $row
        .find("li.lit[level]")
        .toArray()
        .map((item) => Number($(item).attr("level")))
        .filter(Boolean);

      if (!name || !levels.length) return null;

      return {
        name,
        slug: slugify(name),
        levels,
      };
    })
    .filter(Boolean);

  return { quickOrder, rows };
}

function parseChampionCards($, rootSelector) {
  const $root =
    typeof rootSelector === "string" ? $(rootSelector).first() : $(rootSelector).first();

  return $root
    .find(".data-mod .ico-holder")
    .toArray()
    .map((holder) => {
      const $holder = $(holder);
      const anchor = $holder.find("a").first();
      const championImage = $holder.find("img.champion").first();
      const laneImage = $holder.find("img.lane").first();
      const name =
        cleanText($holder.children("span").first().text()) ||
        anchor.attr("title") ||
        championImage.attr("alt");

      if (!name) return null;

      return {
        name,
        slug: slugify(name),
        href: toAbsoluteUrl(anchor.attr("href") || ""),
        imageUrl: toAbsoluteUrl(championImage.attr("src") || ""),
        lane: cleanText(laneImage.attr("alt") || "") || null,
        laneImageUrl: toAbsoluteUrl(laneImage.attr("src") || ""),
      };
    })
    .filter(Boolean);
}

function parseGuideVariants($) {
  return $(".wf-champion__guide-selector > span[data-guide-id]")
    .toArray()
    .map((node, index) => {
      const $node = $(node);
      const lane = cleanText($node.find("img").first().attr("alt") || "") || null;
      const rank = cleanText($node.find(".rank").first().text()) || null;
      const text = cleanText(
        $node
          .clone()
          .find(".rank")
          .remove()
          .end()
          .text(),
      );

      return {
        guideId: $node.attr("data-guide-id") || `${index + 1}`,
        title: text || `Build ${index + 1}`,
        lane,
        tier: rank,
        isDefault: $node.hasClass("active"),
      };
    })
    .filter((variant) => variant.guideId);
}

function parseVariantData($, guideId) {
  const pickRoot = (selector) => {
    const byGuideId = $(`${selector}[data-guide-id="${guideId}"]`).first();
    return byGuideId.length ? byGuideId : $(selector).first();
  };

  const itemsRoot = pickRoot(".wf-champion__data__items.data-block");
  const spellsRoot = pickRoot(".wf-champion__data__spells.data-block");
  const situationalItemsRoot = pickRoot(".wf-champion__data__situational.data-block");
  const situationalRunesRoot = pickRoot(".wf-champion__data__situational-runes.data-block");
  const skillsRoot = pickRoot(".skills-counters-block.data-block");
  const boots = parseEntityList($, itemsRoot.find(".section.boots").first(), "Item");
  const finalBuild = parseEntityList($, itemsRoot.find(".section.final").first(), "Item");
  const combinedFinalBuild = [...finalBuild];

  if (boots.length === 2) {
    combinedFinalBuild.push({
      ...boots[0],
      id: boots[1].id ?? boots[0].id ?? null,
      name: `${boots[0].name} - ${boots[1].name}`,
      slug: `${boots[0].slug}-${boots[1].slug}`,
      imageUrl: boots[1].imageUrl || boots[0].imageUrl || null,
      imageAlt: `${boots[0].name} - ${boots[1].name}`,
    });
  } else if (boots.length === 1) {
    combinedFinalBuild.push(boots[0]);
  }

  return {
    itemBuild: {
      starting: parseEntityList($, itemsRoot.find(".section.starting").first(), "Item"),
      core: parseEntityList($, itemsRoot.find(".section.core").first(), "Item"),
      boots,
      finalBuild: combinedFinalBuild,
    },
    spellsAndRunes: {
      summonerSpells: parseEntityList(
        $,
        spellsRoot.find(".section.spells").first(),
        "SummonerSpell",
      ),
      runes: parseEntityList($, spellsRoot.find(".section.runes").first(), "Rune"),
    },
    situationalItems: parseSituationalSections($, situationalItemsRoot, "Item"),
    situationalRunes: parseSituationalSections($, situationalRunesRoot, "Rune"),
    skillOrder: parseSkillOrder($, skillsRoot),
    counters: parseChampionCards(
      $,
      skillsRoot.find('.wf-champion__data__counters:has(h2:contains("Countered By"))').first(),
    ),
    synergies: parseChampionCards(
      $,
      skillsRoot.find('.wf-champion__data__counters:has(h2:contains("Synergizes With"))').first(),
    ),
  };
}

function parseCombo($, root) {
  return $(root)
    .find(".chapter-combo .ico-holder")
    .toArray()
    .map((holder) => {
      const $holder = $(holder);
      const label = cleanText($holder.children("div").last().text());
      const image = $holder.find("img").first().attr("src");

      if (!label) return null;

      return {
        label,
        imageUrl: toAbsoluteUrl(image || ""),
      };
    })
    .filter(Boolean);
}

function parseChapterParagraphs($, root) {
  return $(root)
    .find("p")
    .toArray()
    .map((p) => cleanText($(p).text()))
    .filter(Boolean);
}

function parseAbilitiesChapter($, root) {
  return $(root)
    .find(".chapter-ability")
    .toArray()
    .map((ability) => {
      const $ability = $(ability);
      const name = cleanText($ability.find("h3").first().text());
      const icon = $ability.find(".chapter-ability-text__header img").first().attr("src");
      const video = $ability.find('source[type="video/webm"]').first().attr("src");
      const paragraphs = parseChapterParagraphs($, $ability);

      if (!name) return null;

      return {
        name,
        slug: slugify(name),
        iconUrl: toAbsoluteUrl(icon || ""),
        videoUrl: toAbsoluteUrl(video || ""),
        paragraphs,
      };
    })
    .filter(Boolean);
}

function parseBuildBreakdown($, root) {
  const featuredItems = parseEntityList($, $(root).find(".chapter-item-row").first(), "Item");

  return {
    featuredItems,
    paragraphs: parseChapterParagraphs($, root),
  };
}

function parseChapters($) {
  const chapters = {};

  $(".wf-champion__chapters__chapter.view").each((_, chapter) => {
    const $chapter = $(chapter);
    const heading = cleanText($chapter.children("h2").first().text());

    if (!heading) return;

    const key = slugify(heading);
    const entry = {
      heading,
      paragraphs: parseChapterParagraphs($, $chapter),
    };

    if (heading.toLowerCase().includes("how to play")) {
      entry.combo = parseCombo($, $chapter);
    }

    if (heading.toLowerCase().includes("abilities")) {
      entry.abilities = parseAbilitiesChapter($, $chapter);
    }

    if (heading.toLowerCase().includes("build breakdown")) {
      entry.breakdown = parseBuildBreakdown($, $chapter);
    }

    chapters[key] = entry;
  });

  return chapters;
}

function parseTooltipPayload(html) {
  if (!html) return null;

  const $ = cheerio.load(html);
  const root = $(".tt").first();

  if (!root.length) return null;

  const title = cleanText(root.find(".tt__info__title").first().text());
  const cost = cleanText(root.find(".tt__info__cost span").first().text()) || null;
  const stats = root
    .find(".tt__info__stats > span")
    .toArray()
    .map((node) => cleanText($(node).text()))
    .filter(Boolean);
  const lines = root
    .find(".tt__info__uniques > span")
    .toArray()
    .map((node) => cleanText($(node).text()))
    .filter(Boolean);
  const imageUrl = toAbsoluteUrl(root.find(".tt__image img").first().attr("src") || "");

  return {
    title: title || null,
    cost,
    stats,
    lines,
    imageUrl,
  };
}

function mergeOfficialDataIntoGuide(guide, officialData) {
  if (!officialData) return guide;

  guide.official = officialData;

  if (officialData.champion?.title) {
    guide.champion.title = officialData.champion.title;
  }

  if (officialData.abilities?.length) {
    const variantSkillRows = guide.variants?.[0]?.skillOrder?.rows || [];
    const fallbackSlugs = [
      "passive",
      variantSkillRows[0]?.slug || "ability-1",
      variantSkillRows[1]?.slug || "ability-2",
      variantSkillRows[2]?.slug || "ability-3",
      variantSkillRows[3]?.slug || "ultimate",
    ];
    guide.abilitiesRu = officialData.abilities.map((ability, index) => ({
      ...ability,
      slug:
        guide.guideAbilities?.[index]?.slug ||
        fallbackSlugs[index] ||
        ability.slug ||
        `ability-${index + 1}`,
    }));

    guide.abilitiesRu = guide.abilitiesRu.map((ability, index) => {
      if (ability.slug === `ability-${index}` || ability.slug === `ability-${index + 1}`) {
        return {
          ...ability,
          slug: fallbackSlugs[index] || ability.slug,
        };
      }

      return ability;
    });

    if (guide.dictionaries?.abilities) {
      for (const ability of guide.abilitiesRu) {
        const existingAbility = guide.dictionaries.abilities[ability.slug] || {};
        const existingTooltip = existingAbility.tooltip || null;

        guide.dictionaries.abilities[ability.slug] = {
          ...existingAbility,
          name: ability.name,
          slug: ability.slug,
          imageUrl:
            ability.iconUrl || existingAbility.imageUrl || null,
          videoUrl:
            ability.videoUrl || existingAbility.videoUrl || null,
          tooltip: {
            title: ability.name,
            cost: existingTooltip?.cost || null,
            stats: existingTooltip?.stats || [],
            lines: ability.description ? [ability.description] : existingTooltip?.lines || [],
            imageUrl: ability.iconUrl || existingTooltip?.imageUrl || existingAbility.imageUrl || null,
          },
        };
      }
    }
  }

  return guide;
}

async function enrichDictionaryWithTooltips(dictionary, relationType) {
  const entries = Object.values(dictionary);
  const report = {
    relationType,
    total: entries.length,
    enriched: 0,
    skipped: 0,
    failed: 0,
    failedEntries: [],
  };

  await Promise.all(
    entries.map(async (entry) => {
      if (!entry?.id) {
        report.skipped += 1;
        return;
      }

      try {
        const html = await fetchTooltipHtml(relationType, entry.id);
        const fetchedTooltip = parseTooltipPayload(html);
        const currentTooltip = entry.tooltip || null;

        entry.tooltip = {
          title: currentTooltip?.title || fetchedTooltip?.title || null,
          cost: fetchedTooltip?.cost || currentTooltip?.cost || null,
          stats: fetchedTooltip?.stats?.length ? fetchedTooltip.stats : currentTooltip?.stats || [],
          lines: currentTooltip?.lines?.length ? currentTooltip.lines : fetchedTooltip?.lines || [],
          imageUrl: currentTooltip?.imageUrl || fetchedTooltip?.imageUrl || null,
        };

        if (!entry.imageUrl && entry.tooltip?.imageUrl) {
          entry.imageUrl = entry.tooltip.imageUrl;
        }
        report.enriched += 1;
      } catch (error) {
        report.failed += 1;
        if (report.failedEntries.length < 10) {
          report.failedEntries.push({
            slug: entry.slug || null,
            id: entry.id || null,
            error: error?.message || String(error),
          });
        }
        console.warn(
          `[wildriftfire-guide] tooltip enrich failed relation=${relationType} slug=${entry.slug || "-"} id=${entry.id || "-"} error=${error?.message || error}`,
        );
        entry.tooltip = null;
      }
    }),
  );

  return report;
}

function applyOfficialAbilityTooltips(guide) {
  if (!guide?.abilitiesRu?.length || !guide?.dictionaries?.abilities) return;

  for (const ability of guide.abilitiesRu) {
    const entry = guide.dictionaries.abilities[ability.slug];
    if (!entry) continue;

    entry.tooltip = {
      title: ability.name,
      cost: entry.tooltip?.cost || null,
      stats: entry.tooltip?.stats || [],
      lines: ability.description ? [ability.description] : entry.tooltip?.lines || [],
      imageUrl: ability.iconUrl || entry.tooltip?.imageUrl || entry.imageUrl || null,
    };

    if (ability.iconUrl) {
      entry.imageUrl = ability.iconUrl;
    }
    if (ability.videoUrl) {
      entry.videoUrl = ability.videoUrl;
    }
    entry.name = ability.name;
  }
}

function collectUniqueEntities(target, entities, type) {
  for (const entity of entities || []) {
    if (!entity?.slug) continue;
    target[type][entity.slug] = {
      id: entity.id ?? null,
      name: entity.name,
      slug: entity.slug,
      imageUrl: entity.imageUrl ?? null,
      imageAlt: entity.imageAlt ?? entity.name,
      kind: entity.kind ?? type,
    };
  }
}

function buildDictionaries(data) {
  const dictionaries = {
    items: {},
    runes: {},
    summonerSpells: {},
    abilities: {},
    champions: {},
  };

  const variants = data.variants?.length
    ? data.variants
    : [
        {
          itemBuild: data.itemBuild,
          spellsAndRunes: data.spellsAndRunes,
          situationalItems: data.situationalItems,
          situationalRunes: data.situationalRunes,
          skillOrder: data.skillOrder,
          counters: data.counters,
          synergies: data.synergies,
        },
      ];

  for (const variant of variants) {
    collectUniqueEntities(dictionaries, variant.itemBuild.starting, "items");
    collectUniqueEntities(dictionaries, variant.itemBuild.core, "items");
    collectUniqueEntities(dictionaries, variant.itemBuild.boots, "items");
    collectUniqueEntities(dictionaries, variant.itemBuild.finalBuild, "items");

    for (const entry of variant.situationalItems) {
      collectUniqueEntities(dictionaries, entry.options, "items");
    }

    collectUniqueEntities(dictionaries, variant.spellsAndRunes.runes, "runes");
    for (const entry of variant.situationalRunes) {
      collectUniqueEntities(dictionaries, entry.options, "runes");
    }

    collectUniqueEntities(
      dictionaries,
      variant.spellsAndRunes.summonerSpells,
      "summonerSpells",
    );
    collectUniqueEntities(dictionaries, variant.skillOrder.quickOrder, "abilities");

    for (const champion of [...variant.counters, ...variant.synergies]) {
      dictionaries.champions[champion.slug] = {
        name: champion.name,
        slug: champion.slug,
        imageUrl: champion.imageUrl,
        lane: champion.lane,
        laneImageUrl: champion.laneImageUrl,
        href: champion.href,
      };
    }
  }

  if (data.buildBreakdown?.featuredItems?.length) {
    collectUniqueEntities(dictionaries, data.buildBreakdown.featuredItems, "items");
  }

  for (const ability of data.guideAbilities || []) {
    dictionaries.abilities[ability.slug] = {
      ...(dictionaries.abilities[ability.slug] || {}),
      name: ability.name,
      slug: ability.slug,
      imageUrl: ability.iconUrl,
      videoUrl: ability.videoUrl,
      kind: dictionaries.abilities[ability.slug]?.kind || "Ability",
      id: dictionaries.abilities[ability.slug]?.id ?? null,
    };
  }

  return dictionaries;
}

function parseGuide(html, sourceUrl, requestedSlug) {
  const $ = cheerio.load(html);
  const info = parseInfoMap($);
  const championName = cleanText($(".champion__desc .name").first().text());
  const championTitle = cleanText($(".champion__desc .title").first().text());
  const blurb = cleanText($(".wf-champion__about__info .blurb").first().text());
  const iconUrl = toAbsoluteUrl($(".champ-icon").first().attr("src") || "");
  const chapters = parseChapters($);
  const buildBreakdown =
    Object.values(chapters).find((chapter) => chapter?.breakdown)?.breakdown || null;
  const guideAbilities =
    Object.values(chapters).find((chapter) => chapter?.abilities)?.abilities || [];
  const variantMeta = parseGuideVariants($);
  const variants = (variantMeta.length ? variantMeta : [{ guideId: "default", title: "Build 1", lane: null, tier: null, isDefault: true }]).map(
    (variant) => ({
      ...variant,
      ...parseVariantData($, variant.guideId),
    }),
  );
  const primaryVariant =
    variants.find((variant) => variant.isDefault) || variants[0] || parseVariantData($, "default");

  const guide = {
    source: {
      site: "wildriftfire",
      url: sourceUrl,
      fetchedAt: new Date().toISOString(),
      contentHash: sha1(html),
    },
    champion: {
      slug: requestedSlug || slugify(championName),
      name: championName || requestedSlug,
      title: championTitle,
      iconUrl,
    },
    metadata: {
      pageTitle: cleanText($("title").first().text()),
      patch: info.Patch || null,
      recommendedRole: primaryVariant?.lane || info["Recommended Role"] || null,
      tier: primaryVariant?.tier || info.Tier || null,
      blurb,
    },
    itemBuild: primaryVariant.itemBuild,
    spellsAndRunes: primaryVariant.spellsAndRunes,
    situationalItems: primaryVariant.situationalItems,
    situationalRunes: primaryVariant.situationalRunes,
    skillOrder: primaryVariant.skillOrder,
    counters: primaryVariant.counters,
    synergies: primaryVariant.synergies,
    variants,
    buildBreakdown,
    guideAbilities,
  };

  guide.dictionaries = buildDictionaries(guide);
  return guide;
}

async function writeGuideFile(slug, data) {
  await fs.mkdir(OUTPUT_ROOT, { recursive: true });
  const outputPath = path.join(OUTPUT_ROOT, `${slug}.json`);
  await fs.writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return outputPath;
}

async function fetchGuideSources(slug, url = resolveWildRiftFireGuideUrl(slug)) {
  const html = await fetchHtml(url, {
    requestedSlug: slug,
    candidateSlug: WILDRIFTFIRE_GUIDE_SLUG_ALIASES[slug] || slug,
    source: "wildriftfire",
  });
  let riotHtml = null;
  let resolvedSlug = null;
  let resolvedLocale = null;
  let riotFetchError = null;

  try {
    const riotPage = await fetchRiotChampionPageWithFallbacks(slug);
    riotHtml = riotPage.html;
    resolvedSlug = riotPage.resolvedSlug;
    resolvedLocale = riotPage.resolvedLocale;
  } catch (error) {
    riotFetchError = {
      message: error instanceof Error ? error.message : String(error),
      source: error?.source || "riot",
      statusCode: Number(error?.statusCode) || null,
      url: error?.url || null,
    };
    console.warn(
      `[wildriftfire-guide] riot detail unavailable slug=${slug} source=${riotFetchError.source} status=${riotFetchError.statusCode || "n/a"} url=${riotFetchError.url || "n/a"} message=${riotFetchError.message}`,
    );
  }

  return {
    guideHtml: html,
    guideUrl: url,
    riotHtml,
    riotResolvedSlug: resolvedSlug,
    riotResolvedLocale: resolvedLocale,
    riotFetchError,
  };
}

function parseGuideSources({
  slug,
  guideHtml,
  guideUrl,
  riotHtml,
  riotResolvedSlug,
  riotResolvedLocale,
}) {
  const guide = parseGuide(guideHtml, guideUrl, slug);
  const officialData =
    riotHtml && riotResolvedSlug
      ? parseRiotChampionData(riotHtml, riotResolvedSlug, riotResolvedLocale)
      : null;

  mergeOfficialDataIntoGuide(guide, officialData);

  return {
    guide, 
    officialData,
  };
}

async function enrichGuideArtifacts(guide) {
  const tooltipReports = [];

  tooltipReports.push(await enrichDictionaryWithTooltips(guide.dictionaries.items, "Item"));
  tooltipReports.push(await enrichDictionaryWithTooltips(guide.dictionaries.runes, "Rune"));
  tooltipReports.push(await enrichDictionaryWithTooltips(
    guide.dictionaries.summonerSpells,
    "SummonerSpell",
  ));
  tooltipReports.push(await enrichDictionaryWithTooltips(guide.dictionaries.abilities, "Ability"));
  applyOfficialAbilityTooltips(guide);

  return {
    tooltipReports,
  };
}

function buildGuideImportReport({ slug, sources, guide, officialData, enrichment }) {
  return {
    slug,
    steps: {
        fetch: {
          guideUrl: sources.guideUrl,
          riotResolvedSlug: sources.riotResolvedSlug,
          riotResolvedLocale: sources.riotResolvedLocale,
          riotFetchError: sources.riotFetchError,
          guideContentHash: guide?.source?.contentHash || null,
        },
      parse: {
        variants: Array.isArray(guide?.variants) ? guide.variants.length : 0,
        counters: Array.isArray(guide?.counters) ? guide.counters.length : 0,
        synergies: Array.isArray(guide?.synergies) ? guide.synergies.length : 0,
        guideAbilities: Array.isArray(guide?.guideAbilities) ? guide.guideAbilities.length : 0,
      },
      official: {
        resolved: Boolean(officialData),
        roles: Array.isArray(officialData?.roles) ? officialData.roles.length : 0,
        abilities: Array.isArray(officialData?.abilities) ? officialData.abilities.length : 0,
        skins: Array.isArray(officialData?.skins) ? officialData.skins.length : 0,
      },
      enrich: {
        tooltipReports: enrichment.tooltipReports,
      },
    },
    summary: {
      champion: guide?.champion?.name || slug,
      patch: guide?.metadata?.patch || null,
      tier: guide?.metadata?.tier || null,
      items: Object.keys(guide?.dictionaries?.items || {}).length,
      runes: Object.keys(guide?.dictionaries?.runes || {}).length,
      abilities: Object.keys(guide?.dictionaries?.abilities || {}).length,
      officialAbilities: guide?.abilitiesRu?.length || 0,
    },
  };
}

async function runGuideScrapePipeline(slug, url = resolveWildRiftFireGuideUrl(slug)) {
  const sources = await fetchGuideSources(slug, url);
  const parsed = parseGuideSources({
    slug,
      guideHtml: sources.guideHtml,
      guideUrl: sources.guideUrl,
      riotHtml: sources.riotHtml,
      riotResolvedSlug: sources.riotResolvedSlug,
      riotResolvedLocale: sources.riotResolvedLocale,
    });
  const enrichment = await enrichGuideArtifacts(parsed.guide);
  const report = buildGuideImportReport({
    slug,
    sources,
    guide: parsed.guide,
    officialData: parsed.officialData,
    enrichment,
  });

  console.log(
    `[wildriftfire-guide] done slug=${slug} variants=${report.steps.parse.variants} counters=${report.steps.parse.counters} synergies=${report.steps.parse.synergies} officialAbilities=${report.summary.officialAbilities}`,
  );

  return {
    guide: parsed.guide,
    report,
  };
}

async function scrapeGuide(slug, url = resolveWildRiftFireGuideUrl(slug)) {
  const result = await runGuideScrapePipeline(slug, url);

  return result.guide;
}

async function main() {
  const args = process.argv.slice(2);
  const writeLocal = args.includes("--write-local");
  const positional = args.filter((arg) => arg !== "--write-local");
  const slug = positional[0] || "braum";
  const url = positional[1] || resolveWildRiftFireGuideUrl(slug);
  const { guide, report } = await runGuideScrapePipeline(slug, url);

  if (writeLocal) {
    const outputPath = await writeGuideFile(slug, guide);
    console.log(`Saved guide JSON to ${outputPath}`);
  } else {
    console.log(JSON.stringify(guide, null, 2));
  }

  console.log(JSON.stringify(report, null, 2));
}

module.exports = {
  OUTPUT_ROOT,
  fetchGuideSources,
  parseGuideSources,
  enrichGuideArtifacts,
  runGuideScrapePipeline,
  scrapeGuide,
  writeGuideFile,
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
