import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(rootDir, ".env"), quiet: true });
dotenv.config({ path: path.join(rootDir, "wr-api", ".env"), quiet: true });
dotenv.config({ path: path.join(rootDir, "ui", ".env.local"), quiet: true });
dotenv.config({ path: path.join(rootDir, "ui", ".env"), quiet: true });

const [
  { updateChampions },
  dbModule,
  schemaModule,
  publicPoolModule,
  championIconsModule,
  objectStorageModule,
  cnHistoryImportModule,
  riftGgImportModule,
  guideImportModule,
] =
  await Promise.all([
    import(pathToFileURL(path.join(rootDir, "wr-api", "lib", "updateChampions.mjs")).href),
    import(pathToFileURL(path.join(rootDir, "wr-api", "db", "client.js")).href),
    import(pathToFileURL(path.join(rootDir, "wr-api", "db", "schema.js")).href),
    import(pathToFileURL(path.join(rootDir, "wr-api", "lib", "championPublicPool.mjs")).href),
    import(pathToFileURL(path.join(rootDir, "wr-api", "lib", "championIcons.mjs")).href),
    import(pathToFileURL(path.join(rootDir, "wr-api", "lib", "objectStorage.mjs")).href),
    import(pathToFileURL(path.join(rootDir, "wr-api", "scripts", "import-cn-history.mjs")).href),
    import(pathToFileURL(path.join(rootDir, "wr-api", "scripts", "import-riftgg-cn-stats.mjs")).href),
    import(pathToFileURL(path.join(rootDir, "wr-api", "lib", "guideImport.mjs")).href),
  ]);

const { db, client } = dbModule;

const parseGuideModule = await import(
  pathToFileURL(path.join(rootDir, "ui", "scripts", "parse-wildriftfire-guide.js")).href,
);

const { champions } = schemaModule;
const { filterChampionsForPublicPool, summarizeChampionPublicPool } = publicPoolModule;
const { createChampionIconStore, buildIconStorageKey } = championIconsModule;
const { createObjectStorageClient, shouldUseS3PublicUrls } = objectStorageModule;
const { runCnHistoryImport } = cnHistoryImportModule;
const { runRiftGgCnStatsImport } = riftGgImportModule;
const { importGuidePayload } = guideImportModule;
const { runGuideScrapePipeline } = parseGuideModule;

function parseCliArgs(argv) {
  const options = {
    slugs: [],
    skipRiftGg: false,
    skipGuides: false,
    guideConcurrency: Math.max(1, Number(process.env.GUIDE_SYNC_CONCURRENCY || 3)),
    skipCnHistory: false,
  };

  for (const arg of argv.slice(2)) {
    if (arg === "--skip-riftgg") {
      options.skipRiftGg = true;
      continue;
    }

    if (arg === "--skip-guides") {
      options.skipGuides = true;
      continue;
    }

    if (arg === "--skip-cn-history") {
      options.skipCnHistory = true;
      continue;
    }

    if (arg.startsWith("--guide-concurrency=")) {
      const value = Number(arg.split("=")[1]);
      if (Number.isFinite(value) && value > 0) {
        options.guideConcurrency = Math.max(1, Math.floor(value));
      }
      continue;
    }

    options.slugs.push(String(arg || "").trim());
  }

  options.slugs = options.slugs.filter(Boolean);
  return options;
}

async function loadChampionRows() {
  return await db
    .select({
      slug: champions.slug,
      nameLocalizations: champions.nameLocalizations,
      icon: champions.icon,
    })
    .from(champions);
}

function buildChampionSyncPlan(championRows, requestedSlugs = []) {
  const requestedSlugSet = new Set(requestedSlugs);
  const publicChampionRows = filterChampionsForPublicPool(championRows);
  const publicSlugs = publicChampionRows
    .map((row) => String(row?.slug || "").trim())
    .filter(Boolean);

  return {
    slugs: requestedSlugs.length
      ? publicSlugs.filter((slug) => requestedSlugSet.has(slug))
      : publicSlugs,
    poolSummary: summarizeChampionPublicPool(championRows),
  };
}

async function runChampionIconSync({ championRows, requestedSlugs = [] }) {
  const requestedSlugSet = new Set(requestedSlugs);
  const publicChampionRows = filterChampionsForPublicPool(championRows);
  const sourceRows = requestedSlugs.length
    ? publicChampionRows.filter((row) => requestedSlugSet.has(String(row?.slug || "").trim()))
    : publicChampionRows;
  const iconRows = sourceRows.filter((row) => String(row?.icon || "").trim());

  const report = {
    total: iconRows.length,
    synced: 0,
    failed: 0,
    failedEntries: [],
    skipped: 0,
    mode: shouldUseS3PublicUrls(process.env) ? "s3" : "local",
  };

  console.log(`[champion-icons] start: champions=${iconRows.length} mode=${report.mode}`);

  const iconStore = await createChampionIconStore(process.env);
  const objectStorage = createObjectStorageClient(process.env);
  const verifyS3 = shouldUseS3PublicUrls(process.env) && objectStorage;

  if (!iconRows.length) {
    console.log("[champion-icons] done -> total=0 synced=0 failed=0 skipped=0");
    return report;
  }

  for (let index = 0; index < iconRows.length; index += 1) {
    const row = iconRows[index];
    const slug = String(row?.slug || "").trim();
    const sourceUrl = String(row?.icon || "").trim();

    if (!slug || !sourceUrl) {
      report.skipped += 1;
      continue;
    }

    try {
      await iconStore.mirror(slug, sourceUrl);

      if (verifyS3) {
        const storageKey = buildIconStorageKey(slug, sourceUrl);
        const exists = await objectStorage.objectExists(storageKey);
        if (!exists) {
          throw new Error(`S3 object missing after mirror: ${storageKey}`);
        }
      }

      report.synced += 1;

      if ((index + 1) % 25 === 0 || index + 1 === iconRows.length) {
        console.log(
          `[champion-icons] progress -> champions=${index + 1}/${iconRows.length} synced=${report.synced} failed=${report.failed}`,
        );
      }
    } catch (error) {
      report.failed += 1;
      report.failedEntries.push({
        slug,
        error: error instanceof Error ? error.message : String(error),
      });
      console.error(
        `[champion-icons] ${index + 1}/${iconRows.length} ${slug} -> failed | ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  console.log(
    `[champion-icons] done -> total=${report.total} synced=${report.synced} failed=${report.failed} skipped=${report.skipped}`,
  );

  return report;
}

async function runGuideSync({ slugs, concurrency }) {
  console.log(`[guide-sync] start: champions=${slugs.length} concurrency=${concurrency}`);

  const synced = [];
  const skippedNoGuide = [];
  const skippedSameHash = [];
  const failed = [];
  let cursor = 0;

  function isWildRiftFireNoGuideError(error) {
    return error?.source === "wildriftfire" && Number(error?.statusCode) === 404;
  }

  async function worker() {
    while (cursor < slugs.length) {
      const index = cursor;
      cursor += 1;
      const slug = slugs[index];
      const startedAt = Date.now();

      try {
        const { guide, report } = await runGuideScrapePipeline(slug);
        const persisted = await importGuidePayload(guide);

        if (persisted.skipped) {
          skippedSameHash.push({ slug, reason: persisted.reason });
          console.log(
            `[guide-sync] ${index + 1}/${slugs.length} ${slug} -> skipped | reason=${persisted.reason} elapsed=${Date.now() - startedAt}ms`,
          );
          continue;
        }

        synced.push({ slug, persisted, report });
        console.log(
          `[guide-sync] ${index + 1}/${slugs.length} ${slug} -> ok | variants=${report.steps.parse.variants} patch=${report.summary.patch || "n/a"} elapsed=${Date.now() - startedAt}ms`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        if (isWildRiftFireNoGuideError(error)) {
          skippedNoGuide.push(slug);
          console.warn(
            `[guide-sync] ${index + 1}/${slugs.length} ${slug} -> skipped-no-guide | elapsed=${Date.now() - startedAt}ms`,
          );
          continue;
        }

        failed.push({ slug, error: message });
        console.error(
          `[guide-sync] ${index + 1}/${slugs.length} ${slug} -> failed | ${message}`,
        );
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, slugs.length) }, () => worker()),
  );

  const report = {
    total: slugs.length,
    synced: synced.length,
    skippedNoGuide: skippedNoGuide.length,
    skippedSameHash: skippedSameHash.length,
    failed: failed.length,
    skippedNoGuideSlugs: skippedNoGuide,
    skippedSameHashEntries: skippedSameHash,
    failedEntries: failed,
  };

  console.log(
    `[guide-sync] done -> total=${report.total} synced=${report.synced} skippedNoGuide=${report.skippedNoGuide} skippedSameHash=${report.skippedSameHash} failed=${report.failed}`,
  );

  return report;
}

async function main() {
  const options = parseCliArgs(process.argv);
  const startedAt = Date.now();

  console.log("[full-sync] step=champions start");
  const championCatalog = await updateChampions();

  const championRows = await loadChampionRows();
  const syncPlan = buildChampionSyncPlan(championRows, options.slugs);
  console.log(
    `[full-sync] champion-pool -> total=${syncPlan.slugs.length} temporaryEnOnly=${syncPlan.poolSummary.temporaryEnOnly} excluded=${syncPlan.poolSummary.excluded}`,
  );

  const report = {
    startedAt: new Date().toISOString(),
    championCatalog,
    championIcons: null,
    cnHistory: null,
    riftgg: null,
    guides: null,
  };

  console.log("[full-sync] step=champion-icons start");
  report.championIcons = await runChampionIconSync({
    championRows,
    requestedSlugs: options.slugs.length ? syncPlan.slugs : [],
  });

  if (!options.skipCnHistory) {
    console.log("[full-sync] step=cn-history start");
    report.cnHistory = await runCnHistoryImport();
  }

  if (!options.skipRiftGg) {
    console.log("[full-sync] step=riftgg start");
    report.riftgg = await runRiftGgCnStatsImport({
      requestedSlugs: options.slugs.length ? syncPlan.slugs : [],
    });
  }

  if (!options.skipGuides) {
    console.log("[full-sync] step=guides start");
    report.guides = await runGuideSync({
      slugs: syncPlan.slugs,
      concurrency: options.guideConcurrency,
    });
  }

  report.finishedAt = new Date().toISOString();
  report.elapsedMs = Date.now() - startedAt;

  console.log("[full-sync] report:");
  console.log(JSON.stringify(report, null, 2));

  if (
    (report.championIcons?.failed || 0) > 0 ||
    (report.riftgg?.failed || 0) > 0 ||
    (report.guides?.failed || 0) > 0
  ) {
    process.exitCode = 1;
  }
}

try {
  await main();
} catch (error) {
  console.error("[full-sync] fatal error:", error);
  process.exitCode = 1;
} finally {
  try {
    await client.end({ timeout: 5 });
  } catch {}
}
