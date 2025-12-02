import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Путь к проекту
const BASE_DIR = "D:\\wildRiftChampions\\ui";

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    console.error(`Не удалось прочитать ${filePath}:`, err.message);
    return null;
  }
}

function maxDate(d1, d2) {
  if (!d1) return d2;
  if (!d2) return d1;
  return new Date(d1) > new Date(d2) ? d1 : d2;
}

// === 1. Читаем список чемпионов ===
const championsFile = path.join(BASE_DIR, "public", "champions.json");
const champions = readJson(championsFile);

if (!champions || !Array.isArray(champions)) {
  console.error("champions.json не найден или формат кривой");
  process.exit(1);
}

// === 2. Ищем самую свежую дату среди всех history ===
let globalLatestDate = null;

for (const champ of champions) {
  const historyPath = path.join(
    BASE_DIR,
    "public",
    "history",
    "champions",
    `${champ.slug}.json`
  );
  const data = readJson(historyPath);
  if (!data || !Array.isArray(data.history)) continue;

  for (const entry of data.history) {
    if (!entry.date) continue;
    globalLatestDate = maxDate(globalLatestDate, entry.date);
  }
}

if (!globalLatestDate) {
  console.error("Не нашли ни одной даты в history");
  process.exit(1);
}

console.log(`Самая свежая дата: ${globalLatestDate}`);

// === 3. Считаем по этой дате суммарный pickRate по всем линиям/рангам (кроме overall) ===
const results = [];

for (const champ of champions) {
  const slug = champ.slug;
  const name = champ.name || slug;

  const historyPath = path.join(
    BASE_DIR,
    "public",
    "history",
    "champions",
    `${slug}.json`
  );
  const data = readJson(historyPath);
  if (!data || !Array.isArray(data.history)) continue;

  const entry = data.history.find((e) => e.date === globalLatestDate);
  if (!entry || !entry.cnStats) continue;

  let totalPickRate = 0;

  // Сумма по каждой линии: { top: X, jungle: Y, ... }
  const roleSums = {};
  // Разбивка по tier внутри линии: { top: { diamondPlus: x, masterPlus: y }, jungle: { ... }, ... }
  const roleTierBreakdown = {};

  for (const [tier, tierStats] of Object.entries(entry.cnStats)) {
    if (tier === "overall") continue; // overall не учитываем

    if (!tierStats || typeof tierStats !== "object") continue;

    for (const [role, stats] of Object.entries(tierStats)) {
      if (!stats || typeof stats.pickRate !== "number") continue;

      const pr = stats.pickRate;

      // Общая сумма по чемпиону
      totalPickRate += pr;

      // Сумма по линии
      if (!roleSums[role]) roleSums[role] = 0;
      roleSums[role] += pr;

      // Разбивка по tier для этой линии
      if (!roleTierBreakdown[role]) roleTierBreakdown[role] = {};
      roleTierBreakdown[role][tier] = pr;
    }
  }

  if (totalPickRate === 0) continue;

  results.push({
    slug,
    name,
    totalPickRate,
    roleSums,
    roleTierBreakdown,
  });
}

// === 4. Сортируем по totalPickRate и выводим топ-5 с подробной разбивкой ===
results.sort((a, b) => b.totalPickRate - a.totalPickRate);
const top5 = results.slice(0, 20);

console.log(
  "\nТоп 5 чемпионов по суммарному pickRate (без overall, по всем линиям и рангам):\n"
);

for (const [index, champ] of top5.entries()) {
  console.log(
    `${index + 1}. ${champ.name} (${
      champ.slug
    }) — totalPickRate: ${champ.totalPickRate.toFixed(2)}%`
  );

  // Линии сортируем по их сумме (самые популярные наверх)
  const rolesSorted = Object.entries(champ.roleSums).sort(
    (a, b) => b[1] - a[1]
  );

  for (const [role, sumByRole] of rolesSorted) {
    const breakdown = champ.roleTierBreakdown[role] || {};

    // Разбивка по tier внутри линии, тоже сортируем по pickRate
    const tiersSorted = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);

    const parts = tiersSorted.map(([tier, pr]) => `${tier}: ${pr.toFixed(2)}%`);

    console.log(
      `   - ${role}: ${sumByRole.toFixed(2)}%  (из них: ${parts.join(", ")})`
    );
  }

  console.log(""); // пустая строка между чемпами
}
