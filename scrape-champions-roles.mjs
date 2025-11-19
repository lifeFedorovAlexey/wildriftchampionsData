// scrape-champions-roles.mjs
// Самодостаточный скрипт:
//  - читает per-champion JSON из ./champions
//  - для каждого slug скрапит роли и сложность по ВСЕМ локалям
//  - обновляет ТОЛЬКО поля roles и difficulty
//    * ТЕПЕРЬ: в чемпионах храним ТОЛЬКО ключи:
//        "roles": ["fighter", "tank"],
//        "difficulty": "medium"
//    * Полные мультиязычные названия лежат в словарях:
//        ./dictionaries/roles.json
//        ./dictionaries/difficulty.json
//  - делает это параллельно по CONCURRENCY чемпионов
//  - пересобирает общий champions.json и обновляет словари

import "dotenv/config";
import puppeteer from "puppeteer";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { LOCALES } from "./constants/locales.js";
import { ROLE_MAP } from "./constants/roles.js";
import { DIFFICULTY_MAP } from "./constants/difficult.js";
import {
  loadChampionsFromDir,
  writeChampionsToDir,
} from "./utils/championsFs.js";
import { normalizeRu, sleep } from "./utils/common.js";

const BASE_URL =
  process.env.BASE_URL_RIOT || "https://wildrift.leagueoflegends.com";

// работаем только с нужными локалями (без id_id)
const EFFECTIVE_LOCALES = LOCALES.filter((l) => l.key !== "id_id");

// Потоки по чемпионам
const CONCURRENCY =
  Number(process.env.SCRAPE_CONCURRENCY || "10") > 0
    ? Number(process.env.SCRAPE_CONCURRENCY || "10")
    : 10;

// ====== FS / пути для словарей ======

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DICTS_DIR = path.join(__dirname, "dictionaries");
const ROLES_DICT_PATH = path.join(DICTS_DIR, "roles.json");
const DIFFICULTY_DICT_PATH = path.join(DICTS_DIR, "difficulty.json");

function loadJsonDict(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {};
    const raw = fs.readFileSync(filePath, "utf8");
    if (!raw.trim()) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error(`⚠️ Не удалось прочитать словарь ${filePath}:`, e);
    return {};
  }
}

function saveJsonDict(filePath, data) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    console.log(`💾 Словарь сохранён: ${filePath}`);
  } catch (e) {
    console.error(`❌ Ошибка записи словаря ${filePath}:`, e);
  }
}

// Глобальные словари в памяти (ключ → объект с name по локалям)
const rolesDict = loadJsonDict(ROLES_DICT_PATH);
const difficultyDict = loadJsonDict(DIFFICULTY_DICT_PATH);

// ====== Хелперы по ролям/сложности ======

function ensureRoleDictEntry(roleKey, ruName, enName) {
  if (!roleKey) return;
  if (!rolesDict[roleKey]) {
    rolesDict[roleKey] = { name: {} };
  }
  const nameObj = rolesDict[roleKey].name;
  if (ruName && !nameObj.ru_ru) {
    nameObj.ru_ru = ruName;
  }
  if (enName && !nameObj.en_us) {
    nameObj.en_us = enName;
  }
}

function ensureDifficultyDictEntry(diffKey, ruName, enName) {
  if (!diffKey) return;
  if (!difficultyDict[diffKey]) {
    difficultyDict[diffKey] = { name: {} };
  }
  const nameObj = difficultyDict[diffKey].name;
  if (ruName && !nameObj.ru_ru) {
    nameObj.ru_ru = ruName;
  }
  if (enName && !nameObj.en_us) {
    nameObj.en_us = enName;
  }
}

// ищем key роли по русскому названию (с учётом altRu) и пополняем словарь
function resolveRoleKeyFromRu(ruNameRaw) {
  if (!ruNameRaw) return null;
  const raw = ruNameRaw.trim();
  if (!raw) return null;

  const norm = normalizeRu(raw);
  if (!norm) return null;

  let roleKey = null;

  for (const key of Object.keys(ROLE_MAP)) {
    const base = normalizeRu(ROLE_MAP[key].ru);
    if (base === norm) {
      roleKey = key;
      break;
    }

    const alt = ROLE_MAP[key].altRu || [];
    for (const a of alt) {
      if (normalizeRu(a) === norm) {
        roleKey = key;
        break;
      }
    }

    if (roleKey) break;
  }

  if (roleKey && ROLE_MAP[roleKey]) {
    const { ru, en } = ROLE_MAP[roleKey];
    ensureRoleDictEntry(roleKey, ru, en);
    return roleKey;
  }

  // fallback: неизвестная роль (желательно потом добавить в словарь руками)
  const genKey =
    normalizeRu(raw)
      .replace(/\s+/g, "_")
      .replace(/[^a-zа-я0-9_]/gi, "") || "unknown";

  console.log("⚠️ [roles] Неизвестная роль (ru_ru):", raw, "=> key:", genKey);

  ensureRoleDictEntry(genKey, raw, raw);
  return genKey;
}

function findDifficultyRuKey(raw) {
  const norm = normalizeRu(raw);
  if (!norm) return null;

  for (const ru of Object.keys(DIFFICULTY_MAP)) {
    if (normalizeRu(ru) === norm) return ru;
  }

  return null;
}

function slugifyKey(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

// из ru-строки сложности получаем ключ вроде "easy", "medium", "hard"
// и пополняем словарь
function resolveDifficultyKeyFromRu(diffRaw) {
  if (!diffRaw) return null;
  const trimmed = diffRaw.trim();
  if (!trimmed) return null;

  const ruKey = findDifficultyRuKey(trimmed) ?? trimmed;
  const enVal = DIFFICULTY_MAP[ruKey] ?? ruKey;
  const key = slugifyKey(enVal);

  ensureDifficultyDictEntry(key, trimmed, enVal);
  return key;
}

// ====== Скрейп страницы чемпиона для конкретной локали ======

async function scrapeRolesAndDifficultyOnPage(page) {
  const data = await page.evaluate(() => {
    let roles = [];
    const rolesWrapper = document.querySelector('[data-testid="roles"]');
    if (rolesWrapper) {
      const detailsNodes = rolesWrapper.querySelectorAll(
        '[data-testid="meta-details"]'
      );

      const collected = [];

      detailsNodes.forEach((el) => {
        const txt = (el.textContent || "").trim();
        if (!txt) return;

        // режем "Стрелок / Убийца" и подобное
        const parts = txt.split(/[•/|,\/]/);
        parts.forEach((part) => {
          const t = part.trim();
          if (t) collected.push(t);
        });
      });

      roles = collected;
    }

    let difficulty = null;
    const diffWrapper = document.querySelector('[data-testid="difficulty"]');
    if (diffWrapper) {
      const dEl = diffWrapper.querySelector('[data-testid="meta-details"]');
      difficulty = dEl?.textContent.trim() || null;
    }

    return { roles, difficulty };
  });

  return data;
}

async function safeGotoWithRetries(page, url, options = {}, maxRetries = 3) {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await page.goto(url, { waitUntil: "networkidle2", ...options });
      return;
    } catch (e) {
      const msg = e?.message || "";

      // типичные временные ошибки навигации
      const isTransient =
        msg.includes("Navigating frame was detached") ||
        msg.includes("LifecycleWatcher disposed") ||
        msg.includes("net::ERR_") ||
        msg.includes("Navigation failed");

      attempt += 1;

      console.warn(
        `   ⚠️ goto error (attempt ${attempt}/${maxRetries}) for ${url}:`,
        msg
      );

      if (!isTransient || attempt >= maxRetries) {
        throw e;
      }

      // небольшой бэкофф
      await sleep(1000 * attempt);
    }
  }
}

// ====== Обработка чемпиона (по всем локалям) ======

async function processChampion(browser, champ) {
  if (!champ.slug) {
    console.warn("⚠️ [roles] Объект без slug, пропускаю:", champ);
    return;
  }

  const slug = champ.slug;
  const page = await browser.newPage();

  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36"
    );

    console.log(`\n🌐 [roles] Чемпион ${slug}: обрабатываю все локали`);

    let rolesInitialized = false;

    for (const locale of EFFECTIVE_LOCALES) {
      const url = `${BASE_URL}/${locale.path}/champions/${slug}/`;

      console.log(`   🌍 [${slug}] locale=${locale.key} URL=${url}`);

      try {
        await safeGotoWithRetries(page, url, { waitUntil: "networkidle2" });
      } catch (e) {
        console.error(
          `   ❌ [${slug}] Не удалось открыть URL для locale=${locale.key}:`,
          e.message
        );
        // пропускаем эту локаль, идём к следующей
        continue;
      }

      await sleep(1500);

      const { roles, difficulty } = await scrapeRolesAndDifficultyOnPage(page);

      if (locale.key === "ru_ru") {
        // базовые роли и ключ сложности из ru_ru

        const roleKeysRaw =
          roles?.map((r) => resolveRoleKeyFromRu(r)).filter(Boolean) ?? [];

        const seen = new Set();
        const roleKeys = [];
        for (const key of roleKeysRaw) {
          if (!seen.has(key)) {
            seen.add(key);
            roleKeys.push(key);
          }
        }

        champ.roles = roleKeys;
        rolesInitialized = true;

        const diffKey = resolveDifficultyKeyFromRu(difficulty);
        champ.difficulty = diffKey || null;
      } else {
        // остальные локали: только дописываем переводы в словари
        if (rolesInitialized && Array.isArray(champ.roles) && roles?.length) {
          const len = Math.min(champ.roles.length, roles.length);
          for (let i = 0; i < len; i++) {
            const roleKey = champ.roles[i];
            const localizedName = roles[i];
            if (!roleKey || !localizedName) continue;

            if (!rolesDict[roleKey]) {
              rolesDict[roleKey] = { name: {} };
            }

            const nameObj = rolesDict[roleKey].name;
            if (!nameObj[locale.key]) {
              nameObj[locale.key] = localizedName;
            }
          }
        }

        if (champ.difficulty && difficulty) {
          ensureDifficultyDictEntry(champ.difficulty, null, null);
          const nameObj = difficultyDict[champ.difficulty].name;
          if (!nameObj[locale.key]) {
            nameObj[locale.key] = difficulty;
          }
        }
      }
    }

    const rolesLog = Array.isArray(champ.roles) ? champ.roles.join(", ") : "";

    console.log(
      `✅ [roles] ${slug}: roles=[${rolesLog}]; difficulty=${
        champ.difficulty ?? "null"
      }`
    );
  } catch (e) {
    console.error(`❌ [roles] Ошибка при обработке ${slug}:`, e);
  } finally {
    await page.close();
  }
}

// ====== main ======

async function main() {
  console.log("🚀 Старт scrape-champions-roles.mjs");
  console.log(
    `🎯 Цель: обновить ТОЛЬКО roles[] (как ключи) и difficulty (ключ) по всем локалям (параллельно по ${CONCURRENCY} чемпионов) и обновить словари.`
  );

  const bySlug = loadChampionsFromDir();

  if (bySlug.size === 0) {
    console.error(
      "❌ [roles] Папка champions пуста. Сначала запусти scrape-champions-names.mjs"
    );
    process.exit(1);
  }

  const onlySlug = process.argv[2];
  let toProcess = [];

  if (onlySlug) {
    const champ = bySlug.get(onlySlug);
    if (!champ) {
      console.error(
        `❌ [roles] Чемпион со slug="${onlySlug}" не найден в ./champions`
      );
      process.exit(1);
    }
    toProcess = [champ];
    console.log(
      `🎯 [roles] Обновляю роли/сложность только для "${onlySlug}" (1 объект).`
    );
  } else {
    toProcess = Array.from(bySlug.values());
    console.log(
      `🎯 [roles] Обновляю роли/сложность для всех (${toProcess.length} объектов).`
    );
  }

  const browser = await puppeteer.launch({ headless: true });

  try {
    let index = 0;
    while (index < toProcess.length) {
      const batch = toProcess.slice(index, index + CONCURRENCY);
      console.log(
        `\n📦 [roles] Обрабатываю батч чемпионов ${index}..${
          index + batch.length - 1
        }`
      );

      await Promise.all(batch.map((champ) => processChampion(browser, champ)));

      index += CONCURRENCY;
    }
  } finally {
    await browser.close();
  }

  // перезаписываем всё в папку + агрегат
  writeChampionsToDir(bySlug);

  // сохраняем словари
  saveJsonDict(ROLES_DICT_PATH, rolesDict);
  saveJsonDict(DIFFICULTY_DICT_PATH, difficultyDict);

  console.log("✅ scrape-champions-roles.mjs завершён");
}

main().catch((e) => {
  console.error("💥 Фатальная ошибка в scrape-champions-roles.mjs:", e);
  process.exit(1);
});
