// scrape-champion-events.mjs
// Собирает события по чемпионам из патч-ноутов:
//  - патч-ноуты по ru_ru
//  - блоки character-changes-details + character-change-* (по умениям)
//  - блок ОБРАЗЫ / SKINS (скины, в т.ч. через таблицы)
//  - для каждого champion+ability / champion+skin создаёт отдельный event
//  - summary "Обратите внимание..." игнорируем
//  - сохраняет в data/champion-events.json

import "dotenv/config";
import puppeteer from "puppeteer";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { loadChampionsFromDir } from "./utils/championsFs.js";

const BASE_URL =
  process.env.BASE_URL_RIOT || "https://wildrift.leagueoflegends.com";

const PATCHES_LIST_URL = `${BASE_URL}/ru-ru/news/game-updates/`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
const EVENTS_PATH = path.join(DATA_DIR, "champion-events.json");

// ================== FS ==================

function saveEvents(eventsBySlug) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(
      EVENTS_PATH,
      JSON.stringify(eventsBySlug, null, 2),
      "utf8"
    );
    console.log("💾 champion-events.json сохранён.");
  } catch (e) {
    console.error("❌ Ошибка записи champion-events.json:", e);
  }
}

// ================== Утилиты ==================

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function normalizeName(str) {
  return String(str).trim().toLowerCase();
}

// ищем чемпиона по тексту (для скинов): пробегаемся по всем известным именам
function detectChampionInText(text, nameToSlug) {
  if (!text) return null;
  const lower = text.toLowerCase();

  for (const [name, slug] of nameToSlug.entries()) {
    if (!name) continue;
    if (lower.includes(name)) {
      return slug;
    }
  }
  return null;
}

// чуть приводим текст скина к человеческому виду
function prettifySkinText(s) {
  if (!s) return s;
  let res = s.replace(/\s+/g, " "); // схлопываем лишние пробелы
  // ставим перенос строки перед "Появится в игре"
  res = res.replace(/\s*Появится в игре/gi, "\nПоявится в игре");
  return res.trim();
}

// детект типа события
function detectEventType(text) {
  const t = (text || "").toLowerCase();

  const hasNew = t.includes("[новое]");
  const hasRemoved = t.includes("[удалено]");
  const hasChanged = t.includes("[изменено]");

  const hasReworkWord =
    t.includes("переработка") ||
    t.includes("переработан") ||
    t.includes("переработана");

  const hasBuffWord =
    t.includes("усилен") ||
    t.includes("усилена") ||
    t.includes("усилены") ||
    t.includes("повышен") ||
    t.includes("увеличен") ||
    t.includes("увеличена") ||
    t.includes("увеличены");

  const hasNerfWord =
    t.includes("ослаблен") ||
    t.includes("ослаблена") ||
    t.includes("ослаблены") ||
    t.includes("уменьшен") ||
    t.includes("уменьшена") ||
    t.includes("уменьшены");

  // скины/образы
  if (t.includes("skin") || t.includes("скин") || t.includes("образ")) {
    return "skin";
  }

  if (hasNerfWord) return "nerf";
  if (hasBuffWord) return "buff";

  // жёсткая переработка
  if (
    hasReworkWord ||
    (hasNew && hasRemoved && hasChanged) ||
    (hasNew && hasRemoved)
  ) {
    return "rework";
  }

  if (hasNew && !hasRemoved && !hasChanged) return "new";

  if (hasChanged && !hasNew && !hasRemoved) return "change";

  return "other";
}

// строим id события (стабильный slug)
function buildEventId(patchKey, championSlug, type, abilityName) {
  const normAbility = (abilityName || "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    // оставляем цифры, латиницу, кириллицу и дефис
    .replace(/[^a-z0-9а-яё\-]/gi, "");

  const base = `${patchKey}-${championSlug}-${type}${
    normAbility ? "-" + normAbility : ""
  }`
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9а-яё\-]/gi, "");

  return base;
}

// ================== Парсинг патчей ==================

async function scrapePatchesList(page) {
  console.log("🌐 Загружаю список патчей:", PATCHES_LIST_URL);

  await page.goto(PATCHES_LIST_URL, { waitUntil: "networkidle2" });

  const patches = await page.evaluate(() => {
    const result = [];
    const cards = document.querySelectorAll("a[href*='patch-notes']");
    cards.forEach((a) => {
      const href = a.getAttribute("href");
      if (!href) return;

      const url = href.startsWith("http")
        ? href
        : new URL(href, location.origin).toString();

      const title =
        a.querySelector("h2, h3, .ContentItem-title")?.textContent?.trim() ||
        "";
      const dateText =
        a.querySelector("time")?.getAttribute("datetime") ||
        a.querySelector("time")?.textContent?.trim() ||
        null;

      result.push({
        url,
        title,
        dateText,
      });
    });

    return result;
  });

  console.log(`🔎 Найдено патчей: ${patches.length}`);
  return patches;
}

/**
 * Разбор конкретной страницы патча.
 * champNameKeys — массив нормализованных имён чемпионов (ru/en/slug).
 *
 * Возвращает:
 *  - championAbilities: [{ championName, abilityName, text }]
 *  - skins: [string] (текст по каждому скину)
 */
async function scrapePatchPage(page, patch, champNameKeys) {
  console.log(`\n📄 Патч: ${patch.title} (${patch.url})`);

  await page.goto(patch.url, { waitUntil: "networkidle2" });
  await sleep(1000);

  const data = await page.evaluate((champNameKeysInner) => {
    const res = {
      patchId: null,
      date: null,
      championAbilities: [],
      skins: [],
    };

    const heading =
      document.querySelector("h1") ||
      document.querySelector("header h1") ||
      null;
    if (heading) {
      res.patchId = heading.textContent.trim();
    }

    const timeEl = document.querySelector("time");
    if (timeEl) {
      res.date = timeEl.getAttribute("datetime") || timeEl.textContent.trim();
    }

    const main =
      document.querySelector("main") ||
      document.querySelector("[data-testid='article']") ||
      document.body;

    // ===== Структурированные блоки изменений чемпионов =====
    const detailsBlocks = main.querySelectorAll(
      '[data-testid="character-changes-details"], .character-changes-details'
    );

    detailsBlocks.forEach((block) => {
      const nameEl =
        block.querySelector('[data-testid="character-name"]') ||
        block.querySelector(".character-name");
      if (!nameEl) return;

      const championName = nameEl.textContent.trim();
      if (!championName) return;

      const changeBlocks = block.querySelectorAll(
        '[data-testid^="character-change-"]'
      );

      changeBlocks.forEach((cb) => {
        const abilityTitleEl =
          cb.querySelector('[data-testid="character-ability-title"]') ||
          cb.querySelector(".character-ability-title");

        // если нет заголовка умения — игнорим, чтобы не плодить мусор
        if (!abilityTitleEl) return;

        const abilityName = abilityTitleEl.textContent.trim();
        if (!abilityName) return;

        const bodyEl =
          cb.querySelector('[data-testid="character-change-body"]') ||
          cb.querySelector(".character-change-body") ||
          cb;

        const items = Array.from(bodyEl.querySelectorAll("li"));
        const parts = items
          .map((li) => li.innerText.trim())
          .filter((t) => t.length > 0);

        const bodyText = parts.join("\n\n");
        if (!bodyText) return;

        res.championAbilities.push({
          championName,
          abilityName,
          text: bodyText,
        });
      });
    });

    // ===== SKINS / ОБРАЗЫ =====

    // 1) Основной путь: заголовок h2/h3/h4 с "скин/образ/skin"
    let skinTitle =
      Array.from(main.querySelectorAll("h2, h3, h4")).find((el) =>
        /skin|скин|образ/i.test(el.textContent)
      ) || null;

    if (skinTitle) {
      let node = skinTitle.nextElementSibling;
      while (node) {
        const tag = node.tagName?.toLowerCase() || "";
        if (/^h[1-6]$/.test(tag)) break;

        if (tag === "div" && node.querySelector("table")) {
          const tds = node.querySelectorAll("td");
          tds.forEach((td) => {
            const txt = td.textContent.replace(/\s+/g, " ").trim();
            if (txt) {
              res.skins.push(txt);
            }
          });
        } else {
          const txt = node.textContent.replace(/\s+/g, " ").trim();
          if (txt) {
            res.skins.push(txt);
          }
        }

        node = node.nextElementSibling;
      }
    }

    // 2) Fallback: если ничего/мало нашли — пробуем по таблицам и именам чемпионов
    if (!res.skins.length) {
      const lowerNames = (champNameKeysInner || []).filter(Boolean);

      // смотрим все td под main
      const tds = main.querySelectorAll("td");
      tds.forEach((td) => {
        const cellText = td.textContent.replace(/\s+/g, " ").trim();
        if (!cellText) return;
        const lower = cellText.toLowerCase();

        // если в ячейке есть имя какого-нибудь чемпиона — считаем это описанием скина
        const hasChampionName = lowerNames.some((nm) => {
          if (!nm) return false;
          return lower.includes(nm);
        });

        if (hasChampionName) {
          res.skins.push(cellText);
        }
      });
    }

    // лёгкая дедупликация по тексту
    res.skins = Array.from(new Set(res.skins));

    return res;
  }, champNameKeys);

  return data;
}

// ================== main ==================

async function main() {
  console.log("🚀 Старт scrape-champion-events.mjs");

  const championsBySlug = loadChampionsFromDir(); // Map<slug, champ>
  if (championsBySlug.size === 0) {
    console.error("❌ champions пуст. Сначала собери чемпионов.");
    process.exit(1);
  }

  // name -> slug (ru/en/slug)
  const nameToSlug = new Map();
  for (const [slug, champ] of championsBySlug.entries()) {
    const names = [];

    if (champ.name?.ru_ru) names.push(champ.name.ru_ru);
    if (champ.name?.en_us) names.push(champ.name.en_us);
    if (champ.name?.default) names.push(champ.name.default);
    names.push(slug);

    for (const n of names) {
      if (!n) continue;
      nameToSlug.set(normalizeName(n), slug);
    }
  }

  const champNameKeys = Array.from(nameToSlug.keys());
  const eventsBySlug = {};

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const patches = await scrapePatchesList(page);

    for (const patch of patches) {
      const patchData = await scrapePatchPage(page, patch, champNameKeys);

      const patchId =
        patchData.patchId ||
        patch.title ||
        patch.url.split("/").filter(Boolean).pop();

      // выдёргиваем версию типа 6.3d из slugа
      const patchSlugFromUrl = patch.url.split("/").filter(Boolean).pop() || "";
      let patchVersion = null;
      const m =
        patchSlugFromUrl.match(/patch-notes-([0-9]+-[0-9]+[a-z]?)/i) || null;
      if (m) {
        patchVersion = m[1].replace("-", ".");
      }

      const patchKey = patchVersion || patchId;
      const patchDate = patchData.date || patch.dateText || null;

      // ===== изменения умений =====
      for (const abilityChange of patchData.championAbilities || []) {
        const key = normalizeName(abilityChange.championName);
        const slug = nameToSlug.get(key);
        if (!slug) {
          console.log(
            `   ⚠️ Чемпион "${abilityChange.championName}" (abilities) не найден по имени, скипаю.`
          );
          continue;
        }

        const type = detectEventType(abilityChange.text);
        const titleAbilityPart = abilityChange.abilityName
          ? ` – ${abilityChange.abilityName}`
          : "";
        const title = `${patchId}${titleAbilityPart} – ${type.toUpperCase()}`;

        const id = buildEventId(
          patchKey,
          slug,
          type,
          abilityChange.abilityName || ""
        );

        const arr = eventsBySlug[slug] || [];
        if (!arr.find((e) => e.id === id)) {
          arr.push({
            id,
            patch: patchVersion || String(patchId), // короткая версия типа "6.3d"
            patchTitle: String(patchId), // полное название "Описание обновления 6.3d..."
            date: patchDate,
            type,
            title,
            abilityName: abilityChange.abilityName || null,
            description: abilityChange.text,
            sourceUrl: patch.url,
          });
          eventsBySlug[slug] = arr;
          console.log(
            `   ✅ [+] ${slug}: ${
              abilityChange.abilityName || "BLOCK"
            } (${type})`
          );
        } else {
          console.log(
            `   ⏩ ${slug}: ${abilityChange.abilityName || "BLOCK"} уже есть`
          );
        }
      }

      // ===== SKINS / ОБРАЗЫ =====
      for (const rawSkinText of patchData.skins || []) {
        const prettyText = prettifySkinText(rawSkinText);
        const slug = detectChampionInText(prettyText, nameToSlug);
        if (!slug) continue;

        const type = "skin";
        const title = (prettyText.split("\n")[0] || prettyText).trim();
        const id = buildEventId(patchKey, slug, type, title);

        const arr = eventsBySlug[slug] || [];
        if (!arr.find((e) => e.id === id)) {
          arr.push({
            id,
            patch: patchVersion || String(patchId),
            patchTitle: String(patchId),
            date: patchDate,
            type,
            title,
            description: prettyText,
            sourceUrl: patch.url,
          });
          eventsBySlug[slug] = arr;
          console.log(`   🎨 [+] ${slug}: ${title}`);
        } else {
          console.log(`   ⏩ [skin] ${slug}: ${title} уже есть`);
        }
      }
    }
  } catch (e) {
    console.error("💥 Фатальная ошибка в scrape-champion-events.mjs:", e);
    process.exit(1);
  } finally {
    await browser.close();
  }

  saveEvents(eventsBySlug);

  console.log("✅ scrape-champion-events.mjs завершён");
}

main();
