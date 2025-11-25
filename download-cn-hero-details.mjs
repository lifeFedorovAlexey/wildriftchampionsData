// download-cn-hero-details.mjs
// Node 18+ (есть встроенный fetch)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- пути ----

const CHAMPIONS_LIST_PATH = path.join(
  __dirname,
  "ui",
  "public",
  "champions.json"
);

// сюда кладём итоговые файлы:
const OUTPUT_DIR = path.join(__dirname, "ui", "public", "stats");

// базовый URL деталей героя
// для примера с Aatrox (heroId=10002) файл называется 10002.js
// предположим, что путь такой:
const HERO_DETAIL_URL = (heroId) =>
  `https://game.gtimg.cn/images/lgamem/act/lrlib/js/hero/${heroId}.js`;

// ---- утилиты ----

function log(...args) {
  console.log(...args);
}

function safeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// иногда китайцы кладут не чистый JSON, а "var a = {...};"
// пробуем сначала как есть, потом выдираем {...}
function parseMaybeWrappedJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Не удалось вытащить JSON из hero detail файла");
    }
    return JSON.parse(match[0]);
  }
}

// привести detail-структуру к нашему виду
function buildLocalHeroJson(slug, cnHeroId, rawJson) {
  const hero = rawJson.hero || {};
  const spells = Array.isArray(rawJson.spells) ? rawJson.spells : [];
  const version = rawJson.version ?? null;
  const fileTime = rawJson.fileTime ?? null;

  const avatar = hero.avatar || null;
  const card = hero.card || null;
  const poster = hero.poster || null;

  const stats = {
    attack: safeNumber(hero.attack),
    attackPerLevel: safeNumber(hero.attackperlevel),
    magic: safeNumber(hero.magic),
    magicPerLevel: safeNumber(hero.magicperlevel),
    hp: safeNumber(hero.hp),
    hpPerLevel: safeNumber(hero.hpperlevel),
    mp: safeNumber(hero.mp),
    mpPerLevel: safeNumber(hero.mpperlevel),
    movespeed: safeNumber(hero.movespeed),
    armor: safeNumber(hero.armor),
    armorPerLevel: safeNumber(hero.armorperlevel),
    spellblock: safeNumber(hero.spellblock),
    spellblockPerLevel: safeNumber(hero.spellblockperlevel),
    hpregen: safeNumber(hero.hpregen),
    hpregenPerLevel: safeNumber(hero.hpregenperlevel),
    mpregen: safeNumber(hero.mpregen),
    mpregenPerLevel: safeNumber(hero.mpregenperlevel),
    crit: safeNumber(hero.crit),
    attackspeed: safeNumber(hero.attackspeed),
    attackspeedPerLevel: safeNumber(hero.attackspeedperlevel),
  };

  const difficulty = {
    difficultyL: safeNumber(hero.difficultyL),
    damage: safeNumber(hero.damage),
    durability: safeNumber(hero.durability),
    mobility: safeNumber(hero.mobility),
    surviveL: safeNumber(hero.surviveL),
    assistL: safeNumber(hero.assistL),
  };

  const localSpells = spells.map((s) => ({
    spellId: s.spellId ?? null,
    spellKey: s.spellKey ?? null,
    name: s.name ?? null,
    description: s.description ?? null,
    icon: s.abilityIconPath ?? null,
    video: s.abilityVideoPath ?? null,
    cd: s.cdtime ?? null,
    costType: s.costtype ?? null,
    costValue: s.costvalue ?? null,
    detail: Array.isArray(s.detail) ? s.detail : [],
  }));

  return {
    slug,
    cnHeroId: String(cnHeroId),
    heroId: hero.heroId ? String(hero.heroId) : String(cnHeroId),
    name: {
      cn: hero.name ?? null,
      titleCn: hero.title ?? null,
    },
    roles: Array.isArray(hero.roles) ? hero.roles : [],
    lane: hero.lane ?? null,
    baseImgUrl: avatar || card || poster || null,
    images: {
      avatar,
      card,
      poster,
    },
    stats,
    difficulty,
    meta: {
      alias: hero.alias ?? null,
      isWeekFree: hero.isWeekFree ?? null,
      version,
      fileTime,
    },
    spells: localSpells,
  };
}

// ---- MAIN ----

async function main() {
  if (!fs.existsSync(CHAMPIONS_LIST_PATH)) {
    throw new Error(`Не найден champions.json по пути: ${CHAMPIONS_LIST_PATH}`);
  }

  const raw = fs.readFileSync(CHAMPIONS_LIST_PATH, "utf-8");
  const champs = JSON.parse(raw);

  if (!Array.isArray(champs)) {
    throw new Error("Ожидался массив в champions.json");
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  log(`📖 champions.json: найдено чемпионов = ${champs.length}`);
  let ok = 0;
  let skippedNoId = 0;
  let failed = 0;

  for (const champ of champs) {
    const slug = champ.slug;
    const cnHeroId = champ.cnHeroId;

    if (!slug || !cnHeroId) {
      skippedNoId++;
      continue;
    }

    const url = HERO_DETAIL_URL(cnHeroId);
    log(`📥 [${slug}] heroId=${cnHeroId} → ${url}`);

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const text = await res.text();
      const json = parseMaybeWrappedJson(text);

      const local = buildLocalHeroJson(slug, cnHeroId, json);

      const outPath = path.join(OUTPUT_DIR, `${slug}.json`);
      fs.writeFileSync(outPath, JSON.stringify(local, null, 2), "utf-8");

      ok++;
      log(`✅ [${slug}] записан → ${outPath}`);
    } catch (e) {
      failed++;
      log(`❌ [${slug}] не удалось скачать/распарсить:`, e.message || e);
    }
  }

  log(
    `\n=== Готово ===\nУспешно: ${ok}\nПропущены без cnHeroId: ${skippedNoId}\nОшибок: ${failed}\nФайлы лежат в: ${OUTPUT_DIR}`
  );
}

main().catch((err) => {
  console.error("❌ Фатальная ошибка:", err);
  process.exit(1);
});
