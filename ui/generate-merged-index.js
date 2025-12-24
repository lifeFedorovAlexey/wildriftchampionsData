// generate-merged-index.js

const fs = require("fs");
const path = require("path");

// Пути
const mergedDir = path.resolve("public", "merged");
const indexPath = path.join(mergedDir, "index.json");

console.log("🔍 Поиск JSON-файлов в:", mergedDir);

// Проверяем, существует ли папка
if (!fs.existsSync(mergedDir)) {
  console.error("❌ Ошибка: папка public/merged не найдена.");
  console.error("Убедитесь, что папка существует.");
  process.exit(1);
}

// Читаем все файлы
const files = fs.readdirSync(mergedDir);
const jsonFiles = files
  .filter((file) => file.endsWith(".json") && file !== "index.json")
  .map((file) => file.replace(".json", ""));

// Сохраняем index.json
fs.writeFileSync(indexPath, JSON.stringify(jsonFiles, null, 2), "utf-8");

console.log(`✅ Успешно создан: /merged/index.json`);
console.log(`📦 Найдено чемпионов: ${jsonFiles.length}`);
console.log("📄 Пример содержимого:");
console.log(JSON.stringify(jsonFiles, null, 2));
