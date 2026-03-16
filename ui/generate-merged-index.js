/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");

const mergedDir = path.resolve("public", "merged");
const indexPath = path.join(mergedDir, "index.json");

console.log("Ищем JSON-файлы в:", mergedDir);

if (!fs.existsSync(mergedDir)) {
  console.error("Ошибка: папка public/merged не найдена.");
  console.error("Убедитесь, что директория существует.");
  process.exit(1);
}

const files = fs.readdirSync(mergedDir);
const jsonFiles = files
  .filter((file) => file.endsWith(".json") && file !== "index.json")
  .map((file) => file.replace(".json", ""));

fs.writeFileSync(indexPath, JSON.stringify(jsonFiles, null, 2), "utf-8");

console.log("Успешно создан: /merged/index.json");
console.log(`Найдено чемпионов: ${jsonFiles.length}`);
