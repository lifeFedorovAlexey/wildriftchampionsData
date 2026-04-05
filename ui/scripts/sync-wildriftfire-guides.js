/* eslint-disable no-console */
const { scrapeGuide, writeGuideFile } = require("./parse-wildriftfire-guide.js");

const DEFAULT_STATS_API_ORIGIN = "http://127.0.0.1:3001";

function getStatsApiBaseUrl() {
  const raw =
    process.env.GUIDES_SYNC_API_ORIGIN ||
    process.env.API_PROXY_TARGET ||
    process.env.NEXT_PUBLIC_STATS_API_ORIGIN ||
    process.env.STATS_API_ORIGIN ||
    process.env.NEXT_PUBLIC_API_ORIGIN ||
    process.env.API_ORIGIN ||
    DEFAULT_STATS_API_ORIGIN;

  return String(raw).replace(/\/+$/, "");
}

function getSyncHeaders() {
  const headers = {
    "content-type": "application/json",
  };
  const sharedSecret = process.env.GUIDES_SYNC_SECRET || "";

  if (sharedSecret) {
    headers["x-guides-sync-secret"] = sharedSecret;
  }

  return headers;
}

async function listChampionSlugs() {
  const baseUrl = getStatsApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/champions?lang=ru_ru`, {
    headers: getSyncHeaders(),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Champion slug fetch failed: HTTP ${response.status}${body ? ` - ${body}` : ""}`,
    );
  }

  const payload = await response.json().catch(() => null);
  if (!Array.isArray(payload)) {
    throw new Error("Champion slug fetch failed: expected array payload");
  }

  return payload
    .map((entry) => String(entry?.slug || "").trim())
    .filter(Boolean)
    .sort();
}

function parseCliArgs(argv) {
  const args = argv.slice(2);
  const options = {
    all: false,
    dryRun: false,
    writeLocal: false,
    slugs: [],
  };

  for (const arg of args) {
    if (arg === "--all") {
      options.all = true;
      continue;
    }

    if (arg === "--no-write-local") {
      options.writeLocal = false;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    options.slugs.push(arg);
  }

  return options;
}

async function pushGuideToApi(guide) {
  const baseUrl = getStatsApiBaseUrl();
  const importUrl =
    process.env.GUIDES_SYNC_IMPORT_URL ||
    `${baseUrl}/api/guides/import`;

  const response = await fetch(importUrl, {
    method: "POST",
    headers: getSyncHeaders(),
    body: JSON.stringify({
      guide,
      source: "wildriftfire",
      fetchedAt: guide?.source?.fetchedAt || new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Guide sync failed for ${guide?.champion?.slug}: HTTP ${response.status}${body ? ` - ${body}` : ""}`,
    );
  }

  return response.json().catch(() => null);
}

async function syncOneGuide(slug, options) {
  const guide = await scrapeGuide(slug);

  if (options.writeLocal) {
    await writeGuideFile(slug, guide);
  }

  const apiResult = options.dryRun
    ? { dryRun: true, slug: guide.champion.slug }
    : await pushGuideToApi(guide);

  return {
    slug,
    patch: guide.metadata?.patch || null,
    variants: guide.variants?.length || 0,
    synced: true,
    apiResult,
  };
}

async function main() {
  const options = parseCliArgs(process.argv);
  const slugs =
    options.all || !options.slugs.length
      ? await listChampionSlugs()
      : options.slugs;

  const results = [];
  const failures = [];
  const skippedNoGuide = [];

  for (const slug of slugs) {
    try {
      console.log(`Syncing guide: ${slug}`);
      const result = await syncOneGuide(slug, options);
      results.push(result);
      console.log(
        `Synced ${slug} (${result.variants} variants, patch ${result.patch || "n/a"})`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (message.includes("HTTP 404")) {
        console.warn(`No guide page for ${slug}, skipping`);
        skippedNoGuide.push(slug);
        continue;
      }

      failures.push({ slug, message });
      console.warn(`Skipped ${slug}: ${message}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        total: slugs.length,
        synced: results.length,
        skippedNoGuideCount: skippedNoGuide.length,
        skippedNoGuide,
        failed: failures.length,
        failures,
      },
      null,
      2,
    ),
  );

  if (failures.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
