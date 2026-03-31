import test from "node:test";
import assert from "node:assert/strict";

import { loadWinratesPageData } from "./load-winrates-page.js";

test("loadWinratesPageData loads updatedAt and snapshot without fetching champions", async () => {
  const previousFetch = global.fetch;
  const calls = [];

  global.fetch = async (url) => {
    calls.push(String(url));

    if (String(url).includes("/api/updated-at")) {
      return new Response(JSON.stringify({ updatedAt: "2026-03-31T10:00:00.000Z" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (String(url).includes("/api/winrates-snapshot?updatedAt=")) {
      return new Response(
        JSON.stringify({
          rowsBySlice: {
            "diamondPlus|mid": [{ slug: "ahri" }],
          },
          maxRowCount: 1,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response("not found", { status: 404 });
  };

  try {
    const result = await loadWinratesPageData("ru_ru", 60);

    assert.equal(result.updatedAt, "2026-03-31T10:00:00.000Z");
    assert.equal(result.maxRowCount, 1);
    assert.deepEqual(result.rowsBySlice["diamondPlus|mid"], [{ slug: "ahri" }]);
    assert.equal(calls.some((url) => url.includes("/api/champions")), false);
  } finally {
    global.fetch = previousFetch;
  }
});

test("loadWinratesPageData returns fallback error payload on failure", async () => {
  const previousFetch = global.fetch;

  global.fetch = async () => {
    throw new Error("network down");
  };

  try {
    const result = await loadWinratesPageData("ru_ru", 60);

    assert.equal(result.updatedAt, null);
    assert.equal(result.maxRowCount, 0);
    assert.deepEqual(result.rowsBySlice, {});
    assert.equal(result.error, "Не удалось загрузить статистику винрейтов.");
  } finally {
    global.fetch = previousFetch;
  }
});
