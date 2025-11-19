// scrape-champions-images.mjs
// Самодостаточный скрипт:
//  - читает per-champion JSON из ./champions
//  - с en-us списка чемпионов скрапит иконки
//  - обновляет ТОЛЬКО поле baseImgUrl в per-champion JSON-файлах
//  - умеет обновлять либо всех, либо одного чемпиона по slug
//  - пересобирает champions.json (облегчённый индекс)

import "dotenv/config";
import puppeteer from "puppeteer";

import {
  loadChampionsFromDir,
  writeChampionsToDir,
} from "./utils/championsFs.js";
import { sleep } from "./utils/common.js";

const BASE_URL =
  process.env.BASE_URL_RIOT || "https://wildrift.leagueoflegends.com";

// Страница, с которой берём иконки
const EN_US_CHAMPIONS_LIST_URL = `${BASE_URL}/en-us/champions/`;

// ===== Скрап списка champion + img для en-us =====

async function scrapeChampionImagesEnUs(page) {
  const listUrl = EN_US_CHAMPIONS_LIST_URL;

  console.log(`\n🔎 [img] en_us, URL: ${listUrl}`);
  await page.goto(listUrl, { waitUntil: "networkidle2" });
  await sleep(2000);

  console.log(`📦 [img] Читаю DOM для en_us...`);

  const champs = await page.evaluate(() => {
    const result = [];

    const grid = document.querySelector('[data-testid="card-grid"]');
    if (!grid) {
      console.warn("⚠️ [img] card-grid не найден");
      return result;
    }

    const cards = grid.querySelectorAll(
      'a[role="button"][href*="/champions/"]'
    );

    cards.forEach((a) => {
      const href = a.getAttribute("href") || "";

      let slug = null;
      const m = href.match(/\/champions\/([^/]+)\//);
      if (m) slug = m[1];

      const img = a.querySelector('img[data-testid="mediaImage"], img');
      const src = img?.getAttribute("src") || "";

      if (!slug || !src) return;

      result.push({
        slug,
        baseImgUrl: src,
      });
    });

    return result;
  });

  console.log(
    `📊 [img] en_us: найдено чемпионов с картинками: ${champs.length}`
  );
  return champs;
}

// ===== main =====

async function main() {
  console.log("🚀 Старт scrape-champions-images.mjs");
  console.log(
    "🎯 Цель: обновить ТОЛЬКО baseImgUrl в per-champion JSON (по en-us списку чемпионов)"
  );

  const onlySlug = process.argv[2] || null;
  if (onlySlug) {
    console.log(
      `🎯 [img] Обновляю картинку ТОЛЬКО для чемпиона со slug="${onlySlug}".`
    );
  } else {
    console.log("🎯 [img] Обновляю картинки для ВСЕХ чемпионов.");
  }

  const bySlug = loadChampionsFromDir();

  if (bySlug.size === 0) {
    console.error(
      "❌ [img] Папка champions пуста. Сначала запусти scrape-champions-names.mjs"
    );
    process.exit(1);
  }

  const browser = await puppeteer.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
    );

    const scraped = await scrapeChampionImagesEnUs(page);

    const champsToApply = onlySlug
      ? scraped.filter((c) => c.slug === onlySlug)
      : scraped;

    if (onlySlug && champsToApply.length === 0) {
      console.warn(
        `⚠️ [img] Чемпион со slug="${onlySlug}" не найден на en-us списке чемпионов`
      );
    }

    console.log(
      `🛠 [img] Обновляю baseImgUrl для ${champsToApply.length} чемпионов`
    );

    for (const { slug, baseImgUrl } of champsToApply) {
      const champ = bySlug.get(slug) || { slug };

      champ.baseImgUrl = baseImgUrl;

      bySlug.set(slug, champ);

      console.log(`  🖼️ [${slug}] baseImgUrl = "${baseImgUrl}"`);
    }

    console.log(`📁 [img] Чемпионов в памяти: ${bySlug.size}, пишу в папку`);

    writeChampionsToDir(bySlug);

    console.log("✅ scrape-champions-images.mjs завершён");
  } catch (err) {
    console.error("💥 Фатальная ошибка в scrape-champions-images.mjs:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
