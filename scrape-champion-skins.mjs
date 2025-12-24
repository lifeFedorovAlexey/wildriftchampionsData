// scrape-all-champions.mjs
// Запуск: node scrape-all-champions.mjs

import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { createWriteStream } from "fs";
import { pipeline } from "stream";
import { promisify } from "util";
import https from "https";

const streamPipeline = promisify(pipeline);

const BASE_URL = "https://modelviewer.lol/champions";
const CDN_ROOT = "https://cdn.modelviewer.lol/lol/models";
const DATA_DIR = path.resolve("data");
const DOWNLOADS_DIR = path.join(DATA_DIR, "downloads");
const CHAMPIONS_DIR = path.join(DATA_DIR, "champions");
const ALL_CHAMPS_JSON = path.join(DATA_DIR, "all-champions.json");

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[\u2019’]/g, "'")
    .replace(/[^a-z0-9\s()\-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeFileName(name) {
  return norm(name)
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/gi, "");
}

function getCdnUrl(championSlug, skinId) {
  return `${CDN_ROOT}/${championSlug}/${skinId}/model.glb`;
}

async function isModelAvailable(championSlug, skinId) {
  return new Promise((resolve) => {
    const req = https.request(
      getCdnUrl(championSlug, skinId),
      { method: "HEAD" },
      (res) => {
        resolve(res.statusCode === 200);
      }
    );
    req.on("error", () => resolve(false));
    req.setTimeout(10000, () => req.destroy());
    req.end();
  });
}

async function downloadModel(championSlug, skinId, skinName) {
  const cdnUrl = getCdnUrl(championSlug, skinId);
  const dir = path.join(DOWNLOADS_DIR, championSlug);
  const filename = `${skinId}_${safeFileName(skinName)}.glb`;
  const filePath = path.join(dir, filename);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1024) {
    console.log(`🟡 Кэш: ${filename}`);
    return { success: true, cached: true };
  }

  try {
    const response = await new Promise((resolve, reject) => {
      const req = https.get(cdnUrl, (res) => {
        if (res.statusCode === 200) {
          resolve(res);
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
      req.on("error", reject);
      req.setTimeout(30000, () => req.destroy());
    });

    await streamPipeline(response, createWriteStream(filePath));

    if (fs.statSync(filePath).size > 1024) {
      console.log(`✅ Скачано: ${filename}`);
      return { success: true, cached: false };
    } else {
      fs.unlinkSync(filePath);
      console.log(`❌ Пустой файл: ${filename}`);
      return { success: false };
    }
  } catch (err) {
    console.log(`❌ Ошибка при скачивании ${skinName}:`, err.message);
    return { success: false };
  }
}

async function getChampionSkins(page, slug) {
  const url = `${BASE_URL}/${slug}`;
  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await sleep(1000);

    return await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll("a[href^='/model-viewer?id=']")
      )
        .map((a) => {
          const href = a.getAttribute("href") || "";
          const idMatch = href.match(/id=(\d+)/);
          if (!idMatch) return null;

          const name = (
            a.querySelector("p")?.textContent ||
            a.textContent ||
            ""
          ).trim();
          if (!name) return null;

          return { id: idMatch[1], name };
        })
        .filter(Boolean);
    });
  } catch (err) {
    console.log(`❌ Ошибка при парсинге ${slug}:`, err.message);
    return [];
  }
}

async function getAllChampions(page) {
  try {
    await page.goto(BASE_URL, { waitUntil: "networkidle2" });
    await sleep(2000);

    return await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a[href^='/champions/']"))
        .map((a) => {
          const href = a.getAttribute("href");
          const match = href?.match(/\/champions\/([^\/?#]+)/);
          return match ? match[1] : null;
        })
        .filter(Boolean);
    });
  } catch (err) {
    console.error("❌ Не удалось получить список чемпионов:", err);
    return [];
  }
}

async function main() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(CHAMPIONS_DIR))
    fs.mkdirSync(CHAMPIONS_DIR, { recursive: true });
  if (!fs.existsSync(DOWNLOADS_DIR))
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.setViewport({ width: 1366, height: 768 });

  try {
    console.log("🚀 Получаем список всех чемпионов...");
    const champions = await getAllChampions(page);
    console.log(`✅ Найдено чемпионов: ${champions.length}`);

    const allChampionsData = [];

    for (const slug of champions) {
      console.log(`\n🔍 Обработка: ${slug}`);
      const mvSkins = await getChampionSkins(page, slug);

      if (mvSkins.length === 0) {
        console.log(`❌ Нет скинов для ${slug}`);
        continue;
      }

      console.log(`✅ Найдено скинов: ${mvSkins.length}`);

      const skinsWithMeta = await Promise.all(
        mvSkins.map(async (skin) => {
          const cdnUrl = getCdnUrl(slug, skin.id);
          const available = await isModelAvailable(slug, skin.id);
          const result = available
            ? await downloadModel(slug, skin.id, skin.name)
            : { success: false };

          return {
            id: skin.id,
            name: skin.name,
            cdnUrl,
            available,
            downloaded: result.success,
            cached: !!result.cached,
            filename: `${skin.id}_${safeFileName(skin.name)}.glb`,
          };
        })
      );

      const downloaded = skinsWithMeta.filter((s) => s.downloaded).length;
      const failed = skinsWithMeta.filter((s) => !s.available).length;

      const championData = {
        slug,
        skinCount: mvSkins.length,
        downloaded,
        failed,
        totalAvailable: skinsWithMeta.filter((s) => s.available).length,
        skins: skinsWithMeta,
      };

      const championJsonPath = path.join(CHAMPIONS_DIR, `${slug}.json`);
      await fs.promises.writeFile(
        championJsonPath,
        JSON.stringify(championData, null, 2)
      );
      console.log(`📄 Сохранено: ${championJsonPath}`);

      allChampionsData.push({
        slug,
        skinCount: mvSkins.length,
        downloaded,
        failed,
        url: `champions/${slug}.json`,
      });

      await sleep(500);
    }

    await fs.promises.writeFile(
      ALL_CHAMPS_JSON,
      JSON.stringify(allChampionsData, null, 2)
    );
    console.log(`\n🎉 Готово! Все данные сохранены.`);
    console.log(`📁 Модели: ${DOWNLOADS_DIR}`);
    console.log(`📄 JSON: ${CHAMPIONS_DIR}`);
    console.log(`📄 Общий список: ${ALL_CHAMPS_JSON}`);
  } catch (e) {
    console.error("💥 Ошибка:", e);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error("💥 fatal:", e);
  process.exit(1);
});
