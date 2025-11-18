// scrape-champions-roles.mjs
// Самодостаточный скрипт:
//  - читает per-champion JSON из ./champions
//  - для каждого slug скрапит роли и сложность по ВСЕМ локалям
//  - обновляет ТОЛЬКО поля roles и difficulty
//  - делает это параллельно по CONCURRENCY чемпионов
//  - пересобирает общий champions.json

import "dotenv/config";
import puppeteer from "puppeteer";

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

// ====== Хелперы по ролям/сложности ======

// ищем key роли по русскому названию (с учётом altRu)
function findRoleKeyByRu(ruNameRaw) {
  const norm = normalizeRu(ruNameRaw);
  if (!norm) return null;

  for (const key of Object.keys(ROLE_MAP)) {
    const base = normalizeRu(ROLE_MAP[key].ru);
    if (base === norm) return key;

    const alt = ROLE_MAP[key].altRu || [];
    for (const a of alt) {
      if (normalizeRu(a) === norm) return key;
    }
  }

  return null;
}

function makeRoleObjectFromRu(roleRuRaw) {
  if (!roleRuRaw) return null;
  const raw = roleRuRaw.trim();
  if (!raw) return null;

  const roleKey = findRoleKeyByRu(raw);

  if (roleKey && ROLE_MAP[roleKey]) {
    const { ru, en } = ROLE_MAP[roleKey];
    return {
      key: roleKey,
      name: {
        ru_ru: ru,
        en_us: en,
      },
    };
  }

  // fallback: неизвестная роль (желательно потом добавить в словарь)
  const genKey = normalizeRu(raw)
    .replace(/\s+/g, "_")
    .replace(/[^a-zа-я0-9_]/gi, "");
  console.log("⚠️ [roles] Неизвестная роль (ru_ru):", raw);

  return {
    key: genKey || "unknown",
    name: {
      ru_ru: raw,
      en_us: raw,
    },
  };
}

function findDifficultyRuKey(raw) {
  const norm = normalizeRu(raw);
  if (!norm) return null;

  for (const ru of Object.keys(DIFFICULTY_MAP)) {
    if (normalizeRu(ru) === norm) return ru;
  }

  return null;
}

function setDifficultyFromRu(champ, diffRaw) {
  if (!diffRaw) {
    champ.difficulty = null;
    return;
  }

  const trimmed = diffRaw.trim();
  const ruKey = findDifficultyRuKey(trimmed) ?? trimmed;
  const enVal = DIFFICULTY_MAP[ruKey] ?? ruKey;

  champ.difficulty = {
    ru_ru: trimmed,
    en_us: enVal,
  };
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
      await page.goto(url, { waitUntil: "networkidle2" });
      await sleep(1500);

      const { roles, difficulty } = await scrapeRolesAndDifficultyOnPage(page);

      if (locale.key === "ru_ru") {
        // базовые роли + difficulty из ru_ru
        const roleObjsRaw =
          roles?.map((r) => makeRoleObjectFromRu(r)).filter(Boolean) ?? [];

        const seen = new Set();
        const roleObjs = [];
        for (const r of roleObjsRaw) {
          if (!seen.has(r.key)) {
            seen.add(r.key);
            roleObjs.push(r);
          }
        }

        champ.roles = roleObjs;
        rolesInitialized = true;

        setDifficultyFromRu(champ, difficulty);
      } else {
        // остальные локали: только дописываем name[locale.key] и difficulty[locale.key]
        if (rolesInitialized && Array.isArray(champ.roles) && roles?.length) {
          const len = Math.min(champ.roles.length, roles.length);
          for (let i = 0; i < len; i++) {
            if (
              !champ.roles[i].name ||
              typeof champ.roles[i].name !== "object"
            ) {
              champ.roles[i].name = { ru_ru: roles[i] };
            }
            champ.roles[i].name[locale.key] = roles[i];
          }
        }

        if (!champ.difficulty && difficulty) {
          champ.difficulty = {};
        }

        if (champ.difficulty && difficulty) {
          champ.difficulty[locale.key] = difficulty;
        }
      }
    }

    const rolesLog = (champ.roles || [])
      .map((r) => `${r.key}/${r.name?.ru_ru || "?"}`)
      .join(", ");

    console.log(
      `✅ [roles] ${slug}: roles=[${rolesLog}]; difficulty=${JSON.stringify(
        champ.difficulty
      )}`
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
    `🎯 Цель: обновить ТОЛЬКО roles[] и difficulty по всем локалям (параллельно по ${CONCURRENCY} чемпионов)`
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

  console.log("✅ scrape-champions-roles.mjs завершён");
}

main().catch((e) => {
  console.error("💥 Фатальная ошибка в scrape-champions-roles.mjs:", e);
  process.exit(1);
});
