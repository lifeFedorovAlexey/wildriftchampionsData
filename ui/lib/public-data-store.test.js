import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { readPublicApi } from "./public-data-store.js";

async function createSnapshot(files) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "wildrift-public-data-"));
  const current = path.join(root, "current");
  await fs.mkdir(current, { recursive: true });
  await fs.writeFile(
    path.join(current, "manifest.json"),
    JSON.stringify({ schema: "wildrift-public-snapshot", version: 1, datasets: {} }),
  );

  for (const [name, payload] of Object.entries(files)) {
    const filePath = path.join(current, name);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(payload));
  }

  return root;
}

test("local snapshot keeps champion history filters and availability", async () => {
  const root = await createSnapshot({
    "champion-history.json": {
      items: [
        { date: "2026-04-01", slug: "ahri", rank: "diamondPlus", lane: "mid", winRate: 51 },
        { date: "2026-04-02", slug: "ahri", rank: "diamondPlus", lane: "mid", winRate: 52 },
        { date: "2026-04-02", slug: "ahri", rank: "king", lane: "top", winRate: 49 },
        { date: "2026-04-02", slug: "lux", rank: "diamondPlus", lane: "support", winRate: 53 },
      ],
    },
    "latest-stats-snapshot.json": { filters: { date: "2026-04-02" } },
  });

  const result = await readPublicApi(
    "/api/champion-history",
    new URLSearchParams("slug=ahri&rank=diamondPlus&lane=mid&latest=1&availability=1"),
    { PUBLIC_DATA_MODE: "snapshot", PUBLIC_DATA_DIR: root },
  );

  assert.equal(result.status, 200);
  assert.deepEqual(result.payload.items.map((item) => item.winRate), [52]);
  assert.deepEqual(result.payload.availability, [
    { rank: "diamondPlus", lane: "mid" },
    { rank: "king", lane: "top" },
  ]);
});

test("local snapshot returns a stable tierlist response for a selected slice", async () => {
  const root = await createSnapshot({
    "tierlist-bulk.ru-ru.json": {
      filters: { date: "2026-04-02", lang: "ru_ru" },
      tiersOrder: ["S+", "S", "A", "B", "C", "D"],
      tiersByRankLane: {
        "diamondPlus|mid": { rank: "diamondPlus", lane: "mid", tiers: { "S+": [{ slug: "ahri" }] } },
      },
    },
  });

  const result = await readPublicApi(
    "/api/tierlist",
    new URLSearchParams("rank=diamondPlus&lane=mid&lang=ru_ru"),
    { PUBLIC_DATA_MODE: "snapshot", PUBLIC_DATA_DIR: root },
  );

  assert.deepEqual(result.payload.filters, {
    rank: "diamondPlus",
    lane: "mid",
    date: "2026-04-02",
    lang: "ru_ru",
  });
  assert.deepEqual(result.payload.tiers["S+"], [{ slug: "ahri" }]);
  assert.deepEqual(result.payload.tiers.D, []);
});

test("local snapshot serves the public read surface without the API", async () => {
  const root = await createSnapshot({
    "champions.ru-ru.json": [{ slug: "ahri", name: "Ари", roles: ["mid"], icon: "https://cdn.example/ahri.png" }],
    "champions.en-us.json": [{ slug: "ahri", name: "Ahri", roles: ["mid"], icon: "https://cdn.example/ahri.png" }],
    "champions.ru-ru.names.json": [{ slug: "ahri", name: "Ари" }],
    "updated-at.json": { updatedAt: "2026-04-02T12:00:00.000Z" },
    "latest-stats-snapshot.json": { filters: { date: "2026-04-02" }, items: [] },
    "winrates-snapshot.json": { filters: { date: "2026-04-02" }, items: [] },
    "guides.json": { count: 1, items: [{ slug: "ahri", name: "Ари" }] },
    "guides.slugs.json": ["ahri"],
    "guides/ahri.json": { slug: "ahri", title: "Гайд Ари" },
    "patch-notes.json": { count: 1, items: [{ version: "7.3b", title: "Патч 7.3b" }] },
    "patch-notes/7.3b.json": { version: "7.3b", title: "Патч 7.3b" },
    "trend-events/ahri/mid.json": {
      patches: [{ date: "2026-04-02", version: "7.3b" }],
      seasons: [{ date: "2026-04-01", season: "S1" }],
    },
  });
  const env = { PUBLIC_DATA_MODE: "snapshot", PUBLIC_DATA_DIR: root };

  assert.deepEqual((await readPublicApi("/api/champions", new URLSearchParams("lang=ru_ru&fields=names"), env)).payload, [
    { slug: "ahri", name: "Ари" },
  ]);
  assert.deepEqual((await readPublicApi("/api/updated-at", new URLSearchParams(), env)).payload.updatedAt, "2026-04-02T12:00:00.000Z");
  assert.deepEqual((await readPublicApi("/api/latest-stats-snapshot", new URLSearchParams(), env)).payload.filters.date, "2026-04-02");
  assert.deepEqual((await readPublicApi("/api/winrates-snapshot", new URLSearchParams(), env)).payload.filters.date, "2026-04-02");
  assert.equal((await readPublicApi("/api/guides", new URLSearchParams(), env)).payload.count, 1);
  assert.deepEqual((await readPublicApi("/api/guides", new URLSearchParams("fields=slug"), env)).payload, ["ahri"]);
  assert.equal((await readPublicApi("/api/guides/ahri", new URLSearchParams(), env)).payload.title, "Гайд Ари");
  assert.equal((await readPublicApi("/api/patch-notes", new URLSearchParams(), env)).payload.count, 1);
  assert.equal((await readPublicApi("/api/patch-notes/7.3b", new URLSearchParams(), env)).payload.version, "7.3b");
  assert.deepEqual(
    (await readPublicApi("/api/trend-events", new URLSearchParams("slug=ahri&lane=mid&from=2026-04-02&to=2026-04-02"), env)).payload,
    { patches: [{ date: "2026-04-02", version: "7.3b" }], seasons: [] },
  );
});

test("snapshot mode rejects an unsupported manifest", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "wildrift-public-data-invalid-"));
  const current = path.join(root, "current");
  await fs.mkdir(current, { recursive: true });
  await fs.writeFile(path.join(current, "manifest.json"), JSON.stringify({ schema: "other", version: 1 }));

  await assert.rejects(
    readPublicApi("/api/updated-at", new URLSearchParams(), {
      PUBLIC_DATA_MODE: "snapshot",
      PUBLIC_DATA_DIR: root,
    }),
    /Unsupported public data snapshot/u,
  );
});

