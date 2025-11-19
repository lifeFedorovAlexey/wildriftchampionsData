// scrape-champions-names.mjs
// Самодостаточный скрипт:
//  - по всем локалям Riot скрапит список чемпионов
//  - обновляет ТОЛЬКО поле name в per-champion JSON-файлах
//  - собирает агрегат champions.json (у тебя он сейчас облегчённый) для удобства

import "dotenv/config";
import puppeteer from "puppeteer";
import { LOCALES } from "./constants/locales.js";
import {
  loadChampionsFromDir,
  writeChampionsToDir,
} from "./utils/championsFs.js";
import { sleep } from "./utils/common.js";

const BASE_URL =
  process.env.BASE_URL_RIOT || "https://wildrift.leagueoflegends.com";

// используем только нужные локали (id_id выкидываем целиком)
const EFFECTIVE_LOCALES = LOCALES.filter((l) => l.key !== "id_id");

// Потоки для ЛОКАЛЕЙ
const LOCALE_CONCURRENCY =
  Number(process.env.SCRAPE_CONCURRENCY || "10") > 0
    ? Number(process.env.SCRAPE_CONCURRENCY || "10")
    : 10;

// ===== Скрап списка чемпионов для одной локали =====

async function scrapeChampionListForLocale(page, locale) {
  const listUrl = `${BASE_URL}/${locale.path}/champions/`;

  console.log(`\n🔎 [names] Локаль ${locale.key}, URL: ${listUrl}`);
  await page.goto(listUrl, { waitUntil: "networkidle2" });
  await sleep(2000);

  console.log(`📦 [names] Читаю DOM для ${locale.key}...`);

  const champs = await page.evaluate(() => {
    const result = [];

    const grid = document.querySelector('[data-testid="card-grid"]');
    if (!grid) {
      console.warn("⚠️ [names] card-grid не найден");
      return result;
    }

    const cards = grid.querySelectorAll('a[role="button"][aria-label]');

    cards.forEach((a) => {
      const href = a.getAttribute("href") || "";
      const ariaLabel = a.getAttribute("aria-label") || "";

      let slug = null;
      const m = href.match(/\/champions\/([^/]+)\//);
      if (m) slug = m[1];

      const titleEl = a.querySelector('[data-testid="card-title"]');
      const titleText = (titleEl?.textContent || "").trim();

      const nameLocalized = ariaLabel || titleText;

      if (!slug || !nameLocalized) return;

      result.push({
        slug,
        name: nameLocalized,
      });
    });

    return result;
  });

  console.log(
    `📊 [names] Локаль ${locale.key}: найдено чемпионов: ${champs.length}`
  );
  return champs;
}

// ===== Обработка одной локали: обновление name для всех или одного чемпиона =====

async function processLocale(
  browser,
  locale,
  bySlug,
  primarySlugs,
  primaryLocaleKey,
  onlySlug
) {
  const page = await browser.newPage();
  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
    );

    const scraped = await scrapeChampionListForLocale(page, locale);

    const champsToApply = onlySlug
      ? scraped.filter((c) => c.slug === onlySlug)
      : scraped;

    if (onlySlug && champsToApply.length === 0) {
      console.warn(
        `⚠️ [names] В локали ${locale.key} чемпион со slug="${onlySlug}" не найден на гриде`
      );
    }

    console.log(
      `📊 [names] Локаль ${locale.key}: всего на странице: ${scraped.length}, в обработку пойдёт: ${champsToApply.length}`
    );

    if (locale.key === primaryLocaleKey) {
      champsToApply.forEach(({ slug }) => primarySlugs.add(slug));
    }

    console.log(`🛠 [names] Обновляю name.${locale.key}...`);

    for (const { slug, name } of champsToApply) {
      const champ = bySlug.get(slug) || { slug };

      if (!champ.name || typeof champ.name !== "object") {
        champ.name = {};
      }

      champ.name[locale.key] = name;

      bySlug.set(slug, champ);

      console.log(`  🌐 [${slug}] name.${locale.key} = "${name}"`);
    }
  } catch (e) {
    console.error(`❌ [names] Ошибка в локали ${locale.key}:`, e);
  } finally {
    await page.close();
  }
}

// ===== main =====

async function main() {
  console.log("🚀 Старт scrape-champions-names.mjs");
  console.log(
    `🎯 Цель: обновить ТОЛЬКО name (мультиязычное) в per-champion JSON (локали батчами по ${LOCALE_CONCURRENCY})`
  );

  const onlySlug = process.argv[2] || null;
  if (onlySlug) {
    console.log(
      `🎯 [names] Обновляю имена ТОЛЬКО для чемпиона со slug="${onlySlug}" (по всем локалям).`
    );
  }

  const bySlug = loadChampionsFromDir();

  const browser = await puppeteer.launch({ headless: true });
  const primaryLocaleKey = EFFECTIVE_LOCALES[0].key; // ru_ru
  const primarySlugs = new Set();

  try {
    let index = 0;
    while (index < EFFECTIVE_LOCALES.length) {
      const batch = EFFECTIVE_LOCALES.slice(index, index + LOCALE_CONCURRENCY);
      console.log(
        `\n📦 [names] Обрабатываю локали батчом ${index}..${
          index + batch.length - 1
        }`
      );

      await Promise.all(
        batch.map((locale) =>
          processLocale(
            browser,
            locale,
            bySlug,
            primarySlugs,
            primaryLocaleKey,
            onlySlug
          )
        )
      );

      index += LOCALE_CONCURRENCY;
    }

    // формируем список для агрегата — по порядку ru_ru, потом остальные
    const ordered = [];
    const seen = new Set();

    for (const slug of primarySlugs) {
      const ch = bySlug.get(slug);
      if (ch) {
        ordered.push(ch);
        seen.add(slug);
      }
    }

    for (const [slug, ch] of bySlug.entries()) {
      if (!seen.has(slug)) ordered.push(ch);
    }

    console.log(
      `📁 [names] Чемпионов в памяти: ${ordered.length}, пишу в папку`
    );

    const mapOrdered = new Map();
    for (const ch of ordered) {
      mapOrdered.set(ch.slug, ch);
    }

    writeChampionsToDir(mapOrdered);

    console.log("✅ scrape-champions-names.mjs завершён");
  } catch (err) {
    console.error("💥 Фатальная ошибка в scrape-champions-names.mjs:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
