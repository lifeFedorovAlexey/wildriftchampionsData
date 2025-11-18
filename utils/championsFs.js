// utils/championsFs.js
// Общие FS-утилиты для работы с чемпионами:
//  - CHAMPIONS_DIR / AGGREGATE_JSON
//  - ensureChampionsDir()
//  - loadChampionsFromDir()
//  - cleanupLocalesOnChamp()
//  - writeChampionsToDir()

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
} from "fs";

export const CHAMPIONS_DIR = "./champions";
export const AGGREGATE_JSON = "./champions.json";

export function ensureChampionsDir() {
  if (!existsSync(CHAMPIONS_DIR)) {
    mkdirSync(CHAMPIONS_DIR, { recursive: true });
  }
}

/**
 * Загружает всех чемпионов из CHAMPIONS_DIR.
 * Возвращает Map<slug, champObject>.
 * Если папки или файлов нет — вернёт пустую Map.
 */
export function loadChampionsFromDir() {
  ensureChampionsDir();
  const bySlug = new Map();

  const files = readdirSync(CHAMPIONS_DIR).filter((f) => f.endsWith(".json"));
  if (!files.length) {
    console.log("📂 [fs] Папка champions пуста");
    return bySlug;
  }

  console.log(`📂 [fs] Нашёл файлов чемпионов: ${files.length}`);

  for (const file of files) {
    try {
      const raw = readFileSync(`${CHAMPIONS_DIR}/${file}`, "utf-8");
      const champ = JSON.parse(raw);
      const slug = champ.slug || file.replace(/\.json$/i, "");
      champ.slug = slug;
      bySlug.set(slug, champ);
    } catch (e) {
      console.warn(`⚠️ [fs] Не смог прочитать ${file}:`, e);
    }
  }

  return bySlug;
}

/**
 * Чистит "мусорные" ключи локалей:
 *  - name.ru / name.en / name.id_id
 *  - roles[].name.ru / en / id_id
 *  - difficulty.ru / en / id_id
 */
export function cleanupLocalesOnChamp(champ) {
  if (champ.name && typeof champ.name === "object") {
    delete champ.name.id_id;
    delete champ.name.ru;
    delete champ.name.en;
  }

  if (Array.isArray(champ.roles)) {
    for (const r of champ.roles) {
      if (r && r.name && typeof r.name === "object") {
        delete r.name.id_id;
        delete r.name.ru;
        delete r.name.en;
      }
    }
  }

  if (champ.difficulty && typeof champ.difficulty === "object") {
    delete champ.difficulty.id_id;
    delete champ.difficulty.ru;
    delete champ.difficulty.en;
  }
}

/**
 * Пишет все чемпионские файлы обратно в CHAMPIONS_DIR
 * и агрегат в AGGREGATE_JSON.
 *
 * bySlug: Map<slug, champObject>
 */
export function writeChampionsToDir(bySlug) {
  ensureChampionsDir();

  const list = [];

  for (const [slug, champ] of bySlug.entries()) {
    champ.slug = slug;

    // перед записью чистим лишние локали
    cleanupLocalesOnChamp(champ);

    const path = `${CHAMPIONS_DIR}/${slug}.json`;
    writeFileSync(path, JSON.stringify(champ, null, 2), "utf-8");
    list.push(champ);
  }

  writeFileSync(AGGREGATE_JSON, JSON.stringify(list, null, 2), "utf-8");
  console.log(
    `💾 [fs] champions.json агрегирован из папки champions (объектов: ${list.length})`
  );
}
