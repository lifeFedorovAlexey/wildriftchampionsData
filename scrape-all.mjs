// scrape-all.mjs
import { execSync } from "child_process";

async function main() {
  try {
    console.log("🚀 Старт scrape-all.mjs");

    console.log("\n▶️ STEP 1: обновление имён");
    execSync("node scrape-champions-names.mjs", { stdio: "inherit" });

    console.log("\n▶️ STEP 2: обновление ролей и сложности");
    execSync("node scrape-champions-roles.mjs", { stdio: "inherit" });

    console.log("\n✅ Все зарегистрированные шаги выполнены.");
  } catch (e) {
    console.error("💥 Фатальная ошибка в scrape-all.mjs:", e);
    process.exit(1);
  }
}

main();
