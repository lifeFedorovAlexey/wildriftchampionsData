// debug-cn-hero.mjs
// Диагностика hero_rank_list_v2 для одного героя по hero_id

const HERO_RANK_URL =
  "https://mlol.qt.qq.com/go/lgame_battle_info/hero_rank_list_v2";

// !!! тут ставишь нужный hero_id из hero_list.js
// для Кейл это был 10041 (Ангел правосудия)
const HERO_ID = "10041";

// Просто подписи, чтобы тебе легче ориентироваться глазами
const RANK_LABELS = {
  0: "0 → (?)",
  1: "1 → (?)",
  2: "2 → (?)",
  3: "3 → (?)",
  4: "4 → (?)",
};

const LANE_LABELS = {
  1: "1 → TOP (上单)",
  2: "2 → JUNGLE (打野)",
  3: "3 → MID (中路)",
  4: "4 → ADC (下路)",
  5: "5 → SUPPORT (辅助)",
};

function toPercentStr(v) {
  if (v == null || v === "") return "—";
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  if (n > 0 && n < 1) return (n * 100).toFixed(2) + "%";
  return n.toFixed(2) + "%";
}

async function main() {
  console.log("📥 Fetch:", HERO_RANK_URL);
  const res = await fetch(HERO_RANK_URL);
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`HTTP ${res.status}: ${t.slice(0, 200)}`);
  }

  const json = await res.json();
  const data = json.data || {};

  const rows = [];

  // пробегаем все rankKey и laneKey, фильтруем по нашему HERO_ID
  for (const rankKey of Object.keys(data)) {
    const rankObj = data[rankKey];

    for (const laneKey of Object.keys(rankObj)) {
      const arr = rankObj[laneKey];

      for (const item of arr) {
        if (String(item.hero_id) !== String(HERO_ID)) continue;

        rows.push({
          rankKey,
          laneKey,
          dtstatdate: item.dtstatdate,
          win_rate: item.win_rate_percent ?? item.win_rate,
          appear_rate: item.appear_rate_percent ?? item.appear_rate,
          forbid_rate: item.forbid_rate_percent ?? item.forbid_rate,
          position: item.position,
          strength: item.strength,
          strength_level: item.strength_level,
        });
      }
    }
  }

  console.log(`\n✅ Найдено записей для hero_id=${HERO_ID}: ${rows.length}\n`);

  // выводим в человекочитаемом виде все 4 ранга × 5 линий (что нашлось)
  for (const row of rows) {
    const rLabel = RANK_LABELS[row.rankKey] ?? `rank=${row.rankKey}`;
    const lLabel = LANE_LABELS[row.laneKey] ?? `lane=${row.laneKey}`;

    console.log(
      `=== ${rLabel} | ${lLabel} ===\n` +
        `  дата:        ${row.dtstatdate}\n` +
        `  win_rate:    ${row.win_rate}   (${toPercentStr(row.win_rate)})\n` +
        `  appear_rate: ${row.appear_rate} (${toPercentStr(
          row.appear_rate
        )})\n` +
        `  forbid_rate: ${row.forbid_rate} (${toPercentStr(
          row.forbid_rate
        )})\n` +
        `  position:    ${row.position}\n` +
        `  strength:    ${row.strength} (lvl ${row.strength_level})\n`
    );
  }

  console.log(
    "\nℹ Открой сайт, выбери этого героя, фиксируй линию и щёлкай ранги.\n" +
      "   Там, где совпадают три числа (win/pick/ban), получаешь точное\n" +
      "   соответствие rankKey → Алмаз/Мастер/Король/Пик.\n"
  );
}

main().catch((e) => {
  console.error("❌ Ошибка:", e);
  process.exit(1);
});
