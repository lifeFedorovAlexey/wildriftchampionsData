// scrape-all.mjs
import { execSync } from "child_process";

async function main() {
  const onlySlug = process.argv[2] || null;

  try {
    console.log("🚀 Старт scrape-all.mjs");

    if (onlySlug) {
      console.log(`🎯 Режим одиночного чемпиона: "${onlySlug}"`);
    } else {
      console.log("🎯 Режим полного обновления всех чемпионов");
    }

    console.log("\n▶️ STEP 1: обновление имён");
    execSync(
      onlySlug
        ? `node scrape-champions-names.mjs ${onlySlug}`
        : "node scrape-champions-names.mjs",
      { stdio: "inherit" }
    );

    console.log("\n▶️ STEP 2: обновление ролей и сложности");
    execSync(
      onlySlug
        ? `node scrape-champions-roles.mjs ${onlySlug}`
        : "node scrape-champions-roles.mjs",
      { stdio: "inherit" }
    );

    console.log("\n▶️ STEP 3: обновление картинок (baseImgUrl)");
    execSync(
      onlySlug
        ? `node scrape-champions-images.mjs ${onlySlug}`
        : "node scrape-champions-images.mjs",
      { stdio: "inherit" }
    );

    console.log("\n▶️ STEP 4: обновление умений (abilities)");
    execSync(
      onlySlug
        ? `node scrape-champions-abilities.mjs ${onlySlug}`
        : "node scrape-champions-abilities.mjs",
      { stdio: "inherit" }
    );

    console.log("\n✅ Все зарегистрированные шаги выполнены.");
  } catch (e) {
    console.error("💥 Фатальная ошибка в scrape-all.mjs:", e);
    process.exit(1);
  }
}

main();
