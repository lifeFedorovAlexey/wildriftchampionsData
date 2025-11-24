// merge-cn-full.mjs
// Node 18+ (есть встроенный fetch)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------- Константы ----------

// URL китайского списка героев (ID + poster + alias и т.д.)
const HERO_LIST_URL =
  "https://game.gtimg.cn/images/lgamem/act/lrlib/js/heroList/hero_list.js";

// URL китайской статистики по винрейту
const HERO_RANK_URL =
  "https://mlol.qt.qq.com/go/lgame_battle_info/hero_rank_list_v2";

// пути в проекте
const CHAMPIONS_PATH = path.join(__dirname, "ui", "public", "champions.json");

const OUTPUT_COMBINED_PATH = path.join(
  __dirname,
  "ui",
  "public",
  "cn-combined.json"
);

// директория для истории по чемпионам
const HISTORY_DIR = path.join(
  __dirname,
  "ui",
  "public",
  "history",
  "champions"
);

// файл с ручными фиксами slug → cnHeroId (heroId из hero_list.js)
const FIXES_PATH = path.join(__dirname, "cn-slug-fixes.json");

// файл с несопоставленными чемпами (для ручной правки)
const UNMATCHED_PATH = path.join(__dirname, "cn-unmatched.json");

// ---------- утилиты ----------

function log(...args) {
  console.log(...args);
}

// нормализация slug: "JarvanIV", "jarvan-iv", "JARVAN_IV" → "jarvaniv"
function normSlug(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// slug из poster: "…/Posters/Kayn_0.jpg" -> "kayn" (через normSlug)
function slugFromPoster(poster) {
  if (!poster) return null;
  try {
    const file = poster.split("/").pop(); // Kayn_0.jpg
    if (!file) return null;
    const base = file.split("_")[0]; // Kayn
    if (!base) return null;
    return normSlug(base); // kayn
  } catch {
    return null;
  }
}

// нормализация чисел (строка -> float или null)
function toFloat(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// глубокое сравнение через JSON.stringify (нам достаточно детекта «изменилось/нет»)
function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ---------- 0. загрузить фиксы slug → cnHeroId ----------

function loadSlugFixes() {
  if (!fs.existsSync(FIXES_PATH)) {
    log("ℹ cn-slug-fixes.json не найден, фиксов нет (и это ок).");
    return {};
  }

  const raw = fs.readFileSync(FIXES_PATH, "utf-8");
  const obj = JSON.parse(raw);

  // нормализуем ключи сразу, чтобы искать по normSlug
  const normalized = {};
  for (const [key, value] of Object.entries(obj)) {
    const k = normSlug(key);
    if (!k) continue;
    normalized[k] = String(value);
  }

  log(
    `📖 cn-slug-fixes.json: загружено ручных сопоставлений = ${
      Object.keys(normalized).length
    }`
  );
  return normalized;
}

// ---------- 1. hero_list.js: slug -> cnHeroId ----------

async function fetchHeroList() {
  log("📥 Fetch hero_list.js:", HERO_LIST_URL);
  const res = await fetch(HERO_LIST_URL);

  const text = await res.text();

  // пробуем как JSON
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Не удалось распарсить hero_list.js");
    }
    json = JSON.parse(match[0]);
  }

  const heroList = json.heroList || {};
  log(`✅ hero_list: получено записей: ${Object.keys(heroList).length}`);
  return heroList;
}

// строим Map normSlug -> cnHeroId (по постеру)
function buildSlugToCnIdMap(heroList) {
  const map = new Map();

  for (const [heroId, hero] of Object.entries(heroList)) {
    const poster = hero.poster;
    const slugKey = slugFromPoster(poster);
    if (!slugKey) continue;
    map.set(slugKey, String(heroId));
  }

  log(`✅ slug→cnHeroId (по постеру, с нормализацией): ${map.size} записей`);
  return map;
}

// ---------- 2. champions.json: дописать cnHeroId ----------

function loadChampions() {
  if (!fs.existsSync(CHAMPIONS_PATH)) {
    throw new Error(
      `Файл ${CHAMPIONS_PATH} не найден. Там должен лежать champions.json`
    );
  }

  const raw = fs.readFileSync(CHAMPIONS_PATH, "utf-8");
  const arr = JSON.parse(raw);

  if (!Array.isArray(arr)) {
    throw new Error("Ожидался массив в champions.json");
  }

  log(`📖 champions.json: чемпионов = ${arr.length}`);
  return arr;
}

/**
 * champions  — массив из champions.json
 * slugToCnId — Map(normSlug -> heroId) из постеров
 * slugFixes  — объект { normSlug: heroId } из cn-slug-fixes.json
 */
function updateChampionsWithCnId(champions, slugToCnId, slugFixes) {
  let matchedPoster = 0;
  let matchedFixes = 0;
  let matchedExisting = 0;
  let notMatched = 0;

  const unmatched = [];

  const updated = champions.map((champ) => {
    const rawSlug = champ.slug || "";
    const slugKey = normSlug(rawSlug);

    if (!slugKey) {
      notMatched++;
      unmatched.push({
        slug: rawSlug || null,
        name: champ.name ?? null,
        reason: "emptySlug",
      });
      return champ;
    }

    let cnHeroId = null;

    // 1) пробуем по постеру (normSlug)
    cnHeroId = slugToCnId.get(slugKey) || null;
    if (cnHeroId) {
      matchedPoster++;
    }

    // 2) если по постеру не нашли — пробуем ручные фиксы (normSlug)
    if (!cnHeroId && slugFixes[slugKey]) {
      cnHeroId = String(slugFixes[slugKey]);
      matchedFixes++;
    }

    // 3) если всё ещё нет — оставляем то, что уже было в champions.json
    if (!cnHeroId && champ.cnHeroId) {
      cnHeroId = String(champ.cnHeroId);
      matchedExisting++;
    }

    if (!cnHeroId) {
      notMatched++;

      // вытаскиваем более-менее удобочитаемое имя
      let displayName = champ.slug;
      if (typeof champ.name === "string") {
        displayName = champ.name;
      } else if (champ.name && typeof champ.name === "object") {
        displayName =
          champ.name.ru_ru ||
          champ.name.en_us ||
          Object.values(champ.name)[0] ||
          champ.slug;
      }

      unmatched.push({
        slug: rawSlug,
        name: displayName,
        note:
          'cnHeroId не найден. Добавь в cn-slug-fixes.json { "' +
          rawSlug +
          '": "<heroId>" }',
      });

      return champ;
    }

    // всё ок — проставляем cnHeroId
    return { ...champ, cnHeroId };
  });

  log(
    `✅ cnHeroId по постеру: ${matchedPoster}, по фиксам: ${matchedFixes}, существующие: ${matchedExisting}, без совпадения: ${notMatched}`
  );

  // champions.json обновляем
  fs.writeFileSync(CHAMPIONS_PATH, JSON.stringify(updated, null, 2), "utf-8");
  log(`💾 champions.json обновлён: ${CHAMPIONS_PATH}`);

  // unmatched — в отдельный файл
  fs.writeFileSync(UNMATCHED_PATH, JSON.stringify(unmatched, null, 2), "utf-8");
  log(
    `💾 Несопоставленные чемпионы сохранены в ${UNMATCHED_PATH} (count=${unmatched.length})`
  );

  if (unmatched.length) {
    log(
      "⚠ Есть чемпионы без cnHeroId. Открой cn-unmatched.json и заполни cn-slug-fixes.json."
    );
  }

  return updated;
}

// ---------- 3. hero_rank_list_v2: статы по рангу+линии ----------

// Ранги (подтверждено по Кейл):
// 0 → сводка (все)
// 1 → Алмаз+
// 2 → Мастер+
// 3 → ГМ+
// 4 → Чалик
const RANK_MAP = {
  0: "overall",
  1: "diamondPlus",
  2: "masterPlus",
  3: "king",
  4: "peak",
};

// Линии: по факту API даёт так:
// 1 → mid
// 2 → top
// 3 → adc
// 4 → support
// 5 → jungle
const LANE_MAP = {
  1: "mid",
  2: "top",
  3: "adc",
  4: "support",
  5: "jungle",
};

async function fetchHeroRank() {
  log("📥 Fetch hero_rank_list_v2:", HERO_RANK_URL);
  const res = await fetch(HERO_RANK_URL);

  if (!res.ok) {
    const t = await res.text();
    throw new Error(
      `hero_rank_list_v2 error ${res.status}: ${t.slice(0, 200)}`
    );
  }

  const json = await res.json();
  const data = json.data || {};
  const statsByHero = {}; // heroId -> { rankName: { laneName: {..} } }

  for (const rankKey of Object.keys(data)) {
    const rankName = RANK_MAP[rankKey] || `rank_${rankKey}`;
    const lanesObj = data[rankKey];

    for (const laneKey of Object.keys(lanesObj)) {
      const laneName = LANE_MAP[laneKey] || `lane_${laneKey}`;
      const arr = lanesObj[laneKey];

      for (const item of arr) {
        const heroId = String(item.hero_id);
        if (!statsByHero[heroId]) statsByHero[heroId] = {};
        if (!statsByHero[heroId][rankName]) statsByHero[heroId][rankName] = {};

        const cell = {
          rank: item.position ? Number(item.position) : null,
          winRate: toFloat(item.win_rate_percent ?? item.win_rate),
          pickRate: toFloat(item.appear_rate_percent ?? item.appear_rate),
          banRate: toFloat(item.forbid_rate_percent ?? item.forbid_rate),
          strengthLevel: item.strength_level
            ? Number(item.strength_level)
            : null,
        };

        statsByHero[heroId][rankName][laneName] = cell;
      }
    }
  }

  log(
    `✅ hero_rank_list_v2: собраны статы для ${
      Object.keys(statsByHero).length
    } hero_id`
  );
  return statsByHero;
}

// ---------- 4. Собрать финальный cn-combined.json ----------

function buildCombined(champions, statsByHeroId) {
  const combined = champions.map((champ) => {
    const cnHeroId = champ.cnHeroId ? String(champ.cnHeroId) : null;
    const cnStats = cnHeroId ? statsByHeroId[cnHeroId] || null : null;

    return {
      slug: champ.slug,
      name: champ.name,
      roles: champ.roles || [],
      cnHeroId,
      cnStats,
    };
  });

  const result = {
    updatedAt: new Date().toISOString(),
    championsCount: champions.length,
    combined,
  };

  fs.writeFileSync(
    OUTPUT_COMBINED_PATH,
    JSON.stringify(result, null, 2),
    "utf-8"
  );

  log(
    `💾 cn-combined.json сохранён: ${OUTPUT_COMBINED_PATH} (champions=${champions.length})`
  );
}

// ---------- 5. История по чемпионам ----------

function updateHistory(champions, statsByHeroId) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  fs.mkdirSync(HISTORY_DIR, { recursive: true });

  let created = 0;
  let updated = 0;
  let unchanged = 0;

  for (const champ of champions) {
    const cnHeroId = champ.cnHeroId ? String(champ.cnHeroId) : null;
    if (!cnHeroId) continue;

    const heroStats = statsByHeroId[cnHeroId];
    if (!heroStats) continue;

    const slug = champ.slug;
    if (!slug) continue;

    const filePath = path.join(HISTORY_DIR, `${slug}.json`);

    /** @type {{ slug: string, name: any, cnHeroId: string, history: Array<{date: string, cnStats: any}> }} */
    let fileData;

    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        fileData = JSON.parse(raw);
      } catch {
        fileData = null;
      }
    }

    if (!fileData || !Array.isArray(fileData.history)) {
      fileData = {
        slug,
        name: champ.name ?? null,
        cnHeroId,
        history: [],
      };
    } else {
      // актуализируем базовую инфу
      fileData.slug = slug;
      fileData.name = champ.name ?? fileData.name ?? null;
      fileData.cnHeroId = cnHeroId;
    }

    const newSnapshot = {
      date: today,
      cnStats: heroStats,
    };

    const existingIndex = fileData.history.findIndex(
      (entry) => entry.date === today
    );

    if (existingIndex >= 0) {
      const existing = fileData.history[existingIndex];

      if (deepEqual(existing.cnStats, newSnapshot.cnStats)) {
        // вообще ничего не поменялось — не трогаем файл
        unchanged++;
        continue;
      }

      fileData.history[existingIndex] = newSnapshot;
      updated++;
    } else {
      fileData.history.push(newSnapshot);
      created++;
    }

    // сортировка по дате по возрастанию
    fileData.history.sort((a, b) => {
      if (a.date < b.date) return -1;
      if (a.date > b.date) return 1;
      return 0;
    });

    fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), "utf-8");
  }

  log(
    `💾 history: created=${created}, updated=${updated}, unchanged=${unchanged} (директория: ${HISTORY_DIR})`
  );

  if (created === 0 && updated === 0 && unchanged > 0) {
    log(
      "ℹ Статы за сегодня совпадают с уже сохранёнными, история не изменилась."
    );
  }
}

// ---------- MAIN ----------

async function main() {
  // 0) ручные фиксы slug → heroId (если есть)
  const slugFixes = loadSlugFixes();

  // 1) китайский список героев (heroId + poster)
  const heroList = await fetchHeroList();
  const slugToCnId = buildSlugToCnIdMap(heroList);

  // 2) твой champions.json → дописать cnHeroId
  const champions = loadChampions();
  const updatedChampions = updateChampionsWithCnId(
    champions,
    slugToCnId,
    slugFixes
  );

  // 3) китайские статы по рангу и лайну
  const statsByHeroId = await fetchHeroRank();

  // 4) финальный объединённый JSON для фронта
  buildCombined(updatedChampions, statsByHeroId);

  // 5) история
  updateHistory(updatedChampions, statsByHeroId);

  log("\n✅ merge-cn-full.mjs: всё готово.\n");
}

main().catch((err) => {
  console.error("❌ Ошибка:", err);
  process.exit(1);
});
