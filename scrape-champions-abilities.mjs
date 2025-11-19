// scrape-champions-abilities.mjs
// Самодостаточный скрипт:
//  - читает per-champion JSON из ./champions
//  - для каждого slug скрапит блок ABILITIES по ВСЕМ локалям
//  - добавляет/обновляет ТОЛЬКО поле abilities в champion JSON
//    abilities: [
//      {
//        slot: "P" | "Q" | "W" | "E" | "R",
//        key: "hextech_munitions",
//        iconUrl: "...jpg",
//        videoUrl: "...mp4",
//        name: { ru_ru, en_us, ... },
//        description: { ru_ru, en_us, ... },
//        extraDescription: { ... } // опционально
//      }, ...
//    ]
//  - умеет работать:
//      node scrape-champions-abilities.mjs        # все чемпы
//      node scrape-champions-abilities.mjs ashe   # один чемп
//  - в конце пишет champions/*.json (полные объекты) + облегчённый champions.json
//    (в режиме одного чемпа — только его файл + агрегат)

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

// работаем только с нужными локалями (без id_id)
const EFFECTIVE_LOCALES = LOCALES.filter((l) => l.key !== "id_id");

// Потоки по чемпионам
const CONCURRENCY =
  Number(process.env.SCRAPE_CONCURRENCY || "4") > 0
    ? Number(process.env.SCRAPE_CONCURRENCY || "4")
    : 4;

// Реальная параллельность по локалям (страниц за раз на чемпиона)
const LOCALE_CONCURRENCY_RAW = Number(
  process.env.SCRAPE_LOCALE_CONCURRENCY || "3"
);
const LOCALE_CONCURRENCY =
  LOCALE_CONCURRENCY_RAW > 0 ? LOCALE_CONCURRENCY_RAW : 3;

// соответствие index → slot
const SLOT_BY_INDEX = ["P", "Q", "W", "E", "R"];

function slugifyKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

// ====== Хелпер: клик по табу абилки с ретраями ======

async function clickAbilityTabWithRetries(page, index, slug, localeKey) {
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // сначала пробуем по img[data-testid]
      await page.click(`img[data-testid="icon-tab-tab-${index}"]`);
      return true;
    } catch (e1) {
      // пробуем fallback по .icon-tab-tab[data-index]
      try {
        await page.click(`.icon-tab-tab[data-index="${index}"]`);
        return true;
      } catch (e2) {
        const msg = e2?.message || e1?.message || "unknown error";

        console.warn(
          `⚠️ [abilities] locale=${localeKey}, slug=${slug}: не удалось кликнуть по ability index=${index} (попытка ${attempt}/${maxRetries}): ${msg}`
        );

        const isTimeout =
          msg.includes("Runtime.callFunctionOn timed out") ||
          msg.includes("Protocol error") ||
          msg.includes("Execution context was destroyed") ||
          msg.includes("Target closed");

        if (attempt >= maxRetries || !isTimeout) {
          // либо исчерпали ретраи, либо ошибка не похожа на временную
          return false;
        }

        // небольшой экспоненциальный бэкофф
        await sleep(500 * attempt);
      }
    }
  }

  return false;
}

// ====== Скрейп ABILITIES на странице чемпиона для конкретной локали ======

async function scrapeAbilitiesOnPageForLocale(page, localeKey, slug) {
  // сначала узнаём, сколько вообще слайдов-абилок
  const data = await page.evaluate(() => {
    const carousel = document.querySelector('[data-testid="carousel"]');
    if (!carousel) {
      console.warn("⚠️ [abilities] carousel не найден");
      return { abilitiesCount: 0 };
    }

    const slidesContainer = carousel.querySelector(
      '[data-testid="slides-container"]'
    );
    if (!slidesContainer) {
      console.warn("⚠️ [abilities] slides-container не найден");
      return { abilitiesCount: 0 };
    }

    const slides = Array.from(
      slidesContainer.querySelectorAll('[data-testid="slide"]')
    );

    const abilitiesCount = slides.length || 0;

    return { abilitiesCount };
  });

  const abilities = [];
  const abilitiesCount = data?.abilitiesCount ?? 0;

  if (!abilitiesCount) {
    console.warn(
      `⚠️ [abilities] Локаль ${localeKey}, slug=${slug}: не найдено ни одной способности`
    );
    return abilities;
  }

  const maxAbilities = Math.min(abilitiesCount, 5);

  for (let index = 0; index < maxAbilities; index++) {
    const clicked = await clickAbilityTabWithRetries(
      page,
      index,
      slug,
      localeKey
    );

    if (!clicked) {
      console.warn(
        `⚠️ [abilities] locale=${localeKey}, slug=${slug}: пропускаю ability index=${index} после неудачных попыток клика`
      );
      continue;
    }

    await sleep(400);

    const ability = await page.evaluate((idx) => {
      // слайд с иконкой + лейблом
      const slide = document.querySelector(
        `[data-testid="slide"][data-slide-index="${idx}"]`
      );

      let iconUrl = null;
      let label = null;

      if (slide) {
        const img =
          slide.querySelector('img[data-testid^="icon-tab-tab-"]') ||
          slide.querySelector("img");
        iconUrl = img?.getAttribute("src") || null;

        const labelEl = slide.querySelector(".icon-tab-label");
        label = labelEl?.textContent?.trim() || null;
      }

      const titleEl = document.querySelector(".icon-tab-media-title");
      const name = titleEl?.textContent?.trim() || label || null;

      const subtitleEl = document.querySelector(".icon-tab-media-subtitle");
      const subtitle = subtitleEl?.textContent?.trim() || null;

      const descEl = document.querySelector(
        ".icon-tab-media-description [data-testid='rich-text-html']"
      );
      const description = descEl?.textContent?.trim() || null;

      const extraEl = document.querySelector(
        ".icon-tab-media-description-hidden [data-testid='rich-text-html']"
      );
      const extraDescription = extraEl?.textContent?.trim() || null;

      const videoSource =
        document.querySelector(
          "video[data-testid='icon-tab-media'] source[type='video/mp4']"
        ) ||
        document.querySelector("video[data-testid='icon-tab-media'] source");

      const videoUrl = videoSource?.getAttribute("src") || null;

      return {
        index: idx,
        label,
        iconUrl,
        videoUrl,
        name,
        subtitle,
        description,
        extraDescription,
      };
    }, index);

    if (!ability) continue;
    abilities.push(ability);
  }

  return abilities;
}

// ====== Обработка одной локали чемпиона (отдельная страница) ======

async function processChampionLocale(browser, champ, locale, abilitiesBySlot) {
  const slug = champ.slug;
  const localeKey = locale.key;
  const url = `${BASE_URL}/${locale.path}/champions/${slug}/`;

  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
    );

    console.log(`   🌍 [${slug}] locale=${localeKey} URL=${url}`);
    await page.goto(url, { waitUntil: "networkidle2" });
    await sleep(1500);

    const abilities = await scrapeAbilitiesOnPageForLocale(
      page,
      localeKey,
      slug
    );

    if (!abilities.length) return;

    for (const a of abilities) {
      const slot = SLOT_BY_INDEX[a.index] || `A${a.index}`;

      let ability = abilitiesBySlot.get(slot);
      if (!ability) {
        ability = {
          slot,
          key: null,
          iconUrl: null,
          videoUrl: null,
          name: {},
          description: {},
          extraDescription: {},
        };
      }

      // Ключ способности — по en_us названию (один раз)
      if (!ability.key && localeKey === "en_us" && a.name) {
        ability.key = slugifyKey(a.name);
      }

      // Иконка и видео — общие, заполняем один раз, при первой нормальной ссылке
      if (!ability.iconUrl && a.iconUrl) {
        ability.iconUrl = a.iconUrl;
      }

      if (!ability.videoUrl && a.videoUrl) {
        ability.videoUrl = a.videoUrl;
      }

      // Тексты — мультиязычные
      if (a.name) {
        ability.name[localeKey] = a.name;
      }

      if (a.description) {
        ability.description[localeKey] = a.description;
      }

      if (a.extraDescription) {
        ability.extraDescription[localeKey] = a.extraDescription;
      }

      abilitiesBySlot.set(slot, ability);
    }
  } catch (e) {
    console.error(
      `❌ [abilities] Ошибка при обработке locale=${localeKey}, slug=${slug}:`,
      e
    );
  } finally {
    await page.close();
  }
}

// ====== Обработка чемпиона (по всем локалям, параллельно по батчам) ======

async function processChampionAbilities(browser, champ) {
  if (!champ.slug) {
    console.warn("⚠️ [abilities] Объект без slug, пропускаю:", champ);
    return champ;
  }

  const slug = champ.slug;

  // abilitiesBySlot: slot → abilityObject (агрегируем по всем локалям)
  const abilitiesBySlot = new Map();

  console.log(`\n🌐 [abilities] Чемпион ${slug}: обрабатываю все локали`);

  const locales = EFFECTIVE_LOCALES.slice();
  let index = 0;

  while (index < locales.length) {
    const batch = locales.slice(index, index + LOCALE_CONCURRENCY);

    await Promise.all(
      batch.map((locale) =>
        processChampionLocale(browser, champ, locale, abilitiesBySlot)
      )
    );

    index += LOCALE_CONCURRENCY;
  }

  // Преобразуем Map в отсортированный массив abilities
  const orderedSlots = ["P", "Q", "W", "E", "R"];
  const finalAbilities = [];

  for (const slot of orderedSlots) {
    const a = abilitiesBySlot.get(slot);
    if (!a) continue;

    // чистим пустой extraDescription, если там ничего нет
    if (a.extraDescription && Object.keys(a.extraDescription).length === 0) {
      delete a.extraDescription;
    }

    // если key так и не выставился — генерим из en_us или ru_ru
    if (!a.key) {
      const baseName =
        a.name?.en_us || a.name?.ru_ru || a.name?.[Object.keys(a.name)[0]];
      if (baseName) {
        a.key = slugifyKey(baseName);
      }
    }

    finalAbilities.push(a);
  }

  champ.abilities = finalAbilities;

  const abilitiesLog = finalAbilities
    .map((a) => `${a.slot}/${a.key || "-"}`)
    .join(", ");

  console.log(`✅ [abilities] ${slug}: abilities=[${abilitiesLog}]`);

  return champ;
}

// ====== main ======

async function main() {
  console.log("🚀 Старт scrape-champions-abilities.mjs");
  console.log(
    `🎯 Цель: обновить ТОЛЬКО abilities[] по всем локалям (параллельно по ${CONCURRENCY} чемпионов, ${LOCALE_CONCURRENCY} локалей на чемпиона)`
  );

  const bySlug = loadChampionsFromDir();

  if (bySlug.size === 0) {
    console.error(
      "❌ [abilities] Папка champions пуста. Сначала запусти scrape-champions-names.mjs"
    );
    process.exit(1);
  }

  const onlySlug = process.argv[2];
  let toProcess = [];

  if (onlySlug) {
    const champ = bySlug.get(onlySlug);
    if (!champ) {
      console.error(
        `❌ [abilities] Чемпион со slug="${onlySlug}" не найден в ./champions`
      );
      process.exit(1);
    }

    // Очищаем Map, оставляем только этого чемпа —
    // чтобы не держать всех в памяти и не перезаписывать лишние файлы
    bySlug.clear();
    bySlug.set(onlySlug, champ);

    toProcess = [champ];
    console.log(
      `🎯 [abilities] Обновляю abilities только для "${onlySlug}" (1 объект).`
    );
  } else {
    toProcess = Array.from(bySlug.values());
    console.log(
      `🎯 [abilities] Обновляю abilities для всех (${toProcess.length} объектов).`
    );
  }

  console.log(
    `🎚 Настройки параллельности: чемпионы=${CONCURRENCY}, локали=${LOCALE_CONCURRENCY}`
  );

  const browser = await puppeteer.launch({ headless: true });

  try {
    let index = 0;
    while (index < toProcess.length) {
      const batch = toProcess.slice(index, index + CONCURRENCY);
      console.log(
        `\n📦 [abilities] Обрабатываю батч чемпионов ${index}..${
          index + batch.length - 1
        }`
      );

      await Promise.all(
        batch.map(async (champ) => {
          const updated = await processChampionAbilities(browser, champ);
          if (updated && updated.slug) {
            bySlug.set(updated.slug, updated);
          }
        })
      );

      index += CONCURRENCY;
    }
  } finally {
    await browser.close();
  }

  // перезаписываем в папку + агрегат:
  //  - в режиме all: все чемпы
  //  - в режиме onlySlug: только один чемп (остальных в Map уже нет)
  writeChampionsToDir(bySlug);

  console.log("✅ scrape-champions-abilities.mjs завершён");
}

main().catch((e) => {
  console.error("💥 Фатальная ошибка в scrape-champions-abilities.mjs:", e);
  process.exit(1);
});
