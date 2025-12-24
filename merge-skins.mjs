// merge-skins.mjs
// Запуск: node merge-skins.mjs

import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve("data");
const DATA_WR_DIR = path.resolve("dataWR");
const MERGED_DIR = path.resolve("merged");

const DOWNLOADS_DIR = "data/downloads"; // относительный путь для local

if (!fs.existsSync(MERGED_DIR)) {
  fs.mkdirSync(MERGED_DIR, { recursive: true });
}

function norm(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[\u2019’]/g, "'")
    .replace(/[^a-z0-9\s()\-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s) {
  const n = norm(s);
  if (!n) return [];
  return n
    .split(" ")
    .map((t) => t.trim())
    .filter(Boolean);
}

function stripChampionName(name, championSlug) {
  const n = norm(name);
  const slug = norm(championSlug);
  if (!n) return "";
  // убираем "имя чемпа" из начала, чтобы "Aatrox Mecha" и т.п. сравнивались по сути скина
  if (n === slug) return ""; // базовый
  if (n.startsWith(slug + " ")) return n.slice(slug.length + 1).trim();
  return n;
}

function jaccard(aTokens, bTokens) {
  const A = new Set(aTokens);
  const B = new Set(bTokens);
  if (A.size === 0 && B.size === 0) return 1;
  if (A.size === 0 || B.size === 0) return 0;

  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

function isBaseSkinName(name, championSlug) {
  const n = norm(name);
  const slug = norm(championSlug);
  if (!n) return false;

  // базовые варианты: "aatrox", "aatrox the darkin blade" и т.п.
  if (n === slug) return true;
  if (n.startsWith(slug + " ")) return true;

  return false;
}

function scoreMatch(wrName, mvName, championSlug) {
  const wrN = norm(wrName);
  const mvN = norm(mvName);
  const slug = norm(championSlug);

  if (!wrN || !mvN) return 0;

  // 1) точное совпадение — топ
  if (wrN === mvN) return 1.0;

  // 2) отдельно обрабатываем базовый скин:
  // mv "aatrox" должен матчиться ТОЛЬКО с wr базовым, а не с "Mecha Aatrox"
  const mvIsBase = mvN === slug;
  if (mvIsBase && !isBaseSkinName(wrName, championSlug)) {
    return 0; // запрещаем прилипание "первого" к остальным
  }

  // 3) сравниваем "суть" названий без чемпа
  const wrCore = stripChampionName(wrName, championSlug);
  const mvCore = stripChampionName(mvName, championSlug);

  const wrTokens = tokenize(wrCore || wrN);
  const mvTokens = tokenize(mvCore || mvN);

  const jac = jaccard(wrTokens, mvTokens);

  // 4) бонусы за содержимое (но аккуратно)
  let bonus = 0;

  // если одна строка полностью содержит другую (после нормализации)
  if (wrCore && mvCore) {
    if (wrCore === mvCore) bonus += 0.25;
    else if (wrCore.includes(mvCore) || mvCore.includes(wrCore)) bonus += 0.12;
  } else {
    if (wrN.includes(mvN) || mvN.includes(wrN)) bonus += 0.08;
  }

  // лёгкий бонус, если совпадают первые токены "ядра"
  if (wrTokens[0] && mvTokens[0] && wrTokens[0] === mvTokens[0]) {
    bonus += 0.05;
  }

  // 5) итог
  // основа — jaccard, плюс бонусы
  let score = jac + bonus;

  // если mvName == slug и wr тоже базовый — разрешаем нормальный матч
  if (mvIsBase && isBaseSkinName(wrName, championSlug)) {
    score = Math.max(score, 0.85);
  }

  // ограничим 1.0
  return Math.min(1.0, score);
}

function getLocalModelPath(championSlug, modelId, modelName) {
  const filename = `${modelId}_${norm(modelName).replace(/\s+/g, "_")}.glb`;
  return path.join(DOWNLOADS_DIR, championSlug, filename);
}

function loadJson(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.warn(`⚠️ Не удалось прочитать ${filePath}:`, err.message);
    return null;
  }
}

function bestMatch3d(wrSkinName, mvSkins, championSlug) {
  if (!Array.isArray(mvSkins) || mvSkins.length === 0) return null;

  let best = null;
  let bestScore = 0;

  for (const mv of mvSkins) {
    const s = scoreMatch(wrSkinName, mv.name, championSlug);
    if (s > bestScore) {
      bestScore = s;
      best = mv;
    }
  }

  // порог: если слишком слабое совпадение — считаем что 3D нет
  // (иначе опять начнётся “приклеивание”)
  const THRESHOLD = 0.55;
  if (bestScore < THRESHOLD) return null;

  return { skin: best, score: bestScore };
}

async function main() {
  const wrFiles = fs
    .readdirSync(DATA_WR_DIR)
    .filter((f) => f.endsWith(".json"));

  console.log(`🔍 Найдено чемпионов в dataWR: ${wrFiles.length}`);

  for (const file of wrFiles) {
    const slug = path.basename(file, ".json");
    console.log(`\n🧩 Обработка: ${slug}`);

    const wrData = loadJson(path.join(DATA_WR_DIR, file));
    const mvData = loadJson(path.join(DATA_DIR, "champions", `${slug}.json`));

    if (!wrData) {
      console.error(`❌ Нет данных WR для ${slug}`);
      continue;
    }

    const mvSkins = mvData?.skins || [];

    const mergedSkins = wrData.skins.map((wrSkin) => {
      const match = bestMatch3d(wrSkin.name, mvSkins, slug);

      if (match?.skin) {
        const matched3d = match.skin;
        const localPath = getLocalModelPath(slug, matched3d.id, matched3d.name);

        return {
          name: wrSkin.name,
          image: {
            preview: wrSkin.preview,
            full: wrSkin.full,
          },
          has3d: true,
          model: {
            cdn: matched3d.cdnUrl,
            local: fs.existsSync(localPath) ? localPath : null,
          },
          // полезно для отладки (можешь потом убрать)
          matchScore: Number(match.score.toFixed(3)),
          matchedName: matched3d.name,
        };
      }

      return {
        name: wrSkin.name,
        image: {
          preview: wrSkin.preview,
          full: wrSkin.full,
        },
        has3d: false,
        model: null,
      };
    });

    const result = {
      slug,
      skinCount: mergedSkins.length,
      with3d: mergedSkins.filter((s) => s.has3d).length,
      skins: mergedSkins,
    };

    const outPath = path.join(MERGED_DIR, `${slug}.json`);
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");
    console.log(`✅ Сохранено: ${outPath}`);
  }

  console.log(`\n🎉 Готово! Все данные объединены: ${MERGED_DIR}/`);
  console.log("📌 Формат: по скинам из WR, с опциональным 3D-дополнением");
}

main().catch((err) => {
  console.error("💥 Ошибка:", err);
  process.exit(1);
});
