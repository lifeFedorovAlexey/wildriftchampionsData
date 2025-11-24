// debug-find-nunu-wukong.mjs
// Node 18+ (есть встроенный fetch)

const HERO_LIST_URL =
  "https://game.gtimg.cn/images/lgamem/act/lrlib/js/heroList/hero_list.js";

function log(...args) {
  console.log(...args);
}

async function fetchHeroList() {
  log("📥 Fetch hero_list.js:", HERO_LIST_URL);
  const res = await fetch(HERO_LIST_URL);
  const text = await res.text();

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

function norm(str) {
  return String(str || "").toLowerCase();
}

async function main() {
  const heroList = await fetchHeroList();

  const results = [];

  for (const [heroId, hero] of Object.entries(heroList)) {
    const name = hero.name || "";
    const title = hero.title || "";
    const alias = hero.alias || "";
    const poster = hero.poster || "";

    const lName = norm(name);
    const lTitle = norm(title);
    const lAlias = norm(alias);
    const lPoster = norm(poster);

    const isNunu =
      lAlias.includes("nunu") ||
      lName.includes("努努") ||
      lTitle.includes("努努") ||
      lPoster.includes("nunu");

    const isWukong =
      lAlias.includes("wukong") ||
      lAlias.includes("monkey") ||
      lName.includes("悟空") ||
      lTitle.includes("齐天大圣") ||
      lPoster.includes("wukong") ||
      lPoster.includes("monkey");

    if (isNunu || isWukong) {
      results.push({
        type: isNunu ? "NUNU" : "WUKONG",
        heroId,
        name,
        title,
        alias,
        poster,
      });
    }
  }

  if (!results.length) {
    log("❌ Ничего не нашли. Попробуй подрегулировать условия поиска.");
    return;
  }

  log("✅ Найдены кандидаты:");
  for (const r of results) {
    console.log("---------");
    console.log(`TYPE:   ${r.type}`);
    console.log(`heroId: ${r.heroId}`);
    console.log(`name:   ${r.name}`);
    console.log(`title:  ${r.title}`);
    console.log(`alias:  ${r.alias}`);
    console.log(`poster: ${r.poster}`);
  }

  console.log(
    "\n👉 Возьми heroId из нужных строк и допиши в cn-slug-fixes.json, например:"
  );
  console.log("{");
  console.log('  "nunuandwillump": "<heroId Нуну>",');
  console.log('  "wukong": "<heroId Вуконга>"');
  console.log("}");
}

main().catch((err) => {
  console.error("❌ Ошибка:", err);
  process.exit(1);
});
