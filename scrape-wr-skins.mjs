import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import https from "https";

const BASE_URL = "https://wildrift.leagueoflegends.com/en-us/champions/";
const DATA_WR_DIR = path.resolve("dataWR");

const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Извлекаем хэш изображения (до .jpg)
function extractImageHash(imgUrl) {
  const match = imgUrl?.match(/\/([^\/]+)\.(jpg|jpeg|png|webp)/i);
  return match ? match[1] : null;
}

// Генерируем URL с нужными параметрами и ПРАВИЛЬНЫМ путём
function buildImageUrl(hash, size = "full") {
  // ✅ Используем game_data_live — актуальные изображения
  const base = `https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/${hash}.jpg`;
  const tags = "?accountingTag=WR&auto=format";

  if (size === "preview") {
    return `${base}${tags}&fit=crop&q=80&h=188&w=334&crop=center`;
  }
  return `${base}${tags}&fit=fill&q=80&w=1280`;
}

// Проверка доступности (HEAD)
async function isImageAvailable(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: "HEAD" }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(10000, () => req.destroy());
    req.end();
  });
}

// Парсим скины
async function getChampionSkinsFromWR(page, slug) {
  const url = `${BASE_URL}${slug}/`;
  console.log(`🔍 Парсинг скинов с: ${url}`);

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await sleep(2000);

    return await page.evaluate(() => {
      const slides = Array.from(
        document.querySelectorAll("li[data-testid='slide']")
      );

      return slides
        .map((slide) => {
          const textEl = slide.querySelector("div:last-child");
          const name = textEl?.textContent.trim() || null;

          const img = slide.querySelector(".thumbnail-border img");
          const src = img?.src || null;
          const dataSrc = img?.dataset?.src || null;
          const imgUrl = src || dataSrc;

          return { name, imgUrl };
        })
        .filter((item) => item.name && item.imgUrl);
    });
  } catch (err) {
    console.error(`❌ Ошибка при парсинге ${slug}:`, err.message);
    return [];
  }
}

async function main() {
  if (!fs.existsSync(DATA_WR_DIR)) {
    fs.mkdirSync(DATA_WR_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.setViewport({ width: 1366, height: 768 });

  try {
    const championsSourceDir = path.join("data", "champions");
    let slugs = [];

    if (fs.existsSync(championsSourceDir)) {
      const files = fs.readdirSync(championsSourceDir);
      slugs = files.map((f) => f.match(/(.+)\.json/)?.[1]).filter(Boolean);
    }

    if (slugs.length === 0) {
      console.log("❌ Нет чемпионов для обработки.");
      return;
    }

    console.log(`✅ Найдено чемпионов: ${slugs.length}`);

    for (const slug of slugs) {
      console.log(`\n🖼️ Обработка: ${slug}`);
      const skins = await getChampionSkinsFromWR(page, slug);

      if (skins.length === 0) {
        console.log(`❌ Не удалось найти скины для ${slug}`);
        continue;
      }

      console.log(`✅ Найдено скинов: ${skins.length}`);

      const processedSkins = await Promise.all(
        skins.map(async (skin) => {
          const hash = extractImageHash(skin.imgUrl);
          if (!hash) {
            console.warn(`⚠️ Не найден хэш в URL:`, skin.imgUrl);
            return null;
          }

          // ✅ Собираем с game_data_live
          const preview = buildImageUrl(hash, "preview");
          const full = buildImageUrl(hash, "full");
          const original = `https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/${hash}.jpg`;

          // ✅ Проверим, доступна ли preview-версия
          const available = await isImageAvailable(preview);

          if (!available) {
            console.log(`❌ Недоступно: ${preview}`);
            return null;
          }

          return {
            name: skin.name,
            hash,
            preview,
            full,
            original,
          };
        })
      ).then((arr) => arr.filter(Boolean)); // убираем null

      const championData = {
        slug,
        skinCount: processedSkins.length,
        skins: processedSkins,
      };

      const jsonPath = path.join(DATA_WR_DIR, `${slug}.json`);
      await fs.promises.writeFile(
        jsonPath,
        JSON.stringify(championData, null, 2)
      );
      console.log(`📄 Сохранено: ${jsonPath}`);
    }

    console.log(
      `\n🎉 Готово! Все изображения скинов сохранены в ${DATA_WR_DIR}/`
    );
  } catch (e) {
    console.error("💥 Ошибка:", e);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("💥 fatal:", err);
  process.exit(1);
});
