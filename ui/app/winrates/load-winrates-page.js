import { fetchApiJson } from "../../lib/server-api.js";
import { buildStatsPaths } from "./winrates-lib.js";

/**
 * @typedef {import("./types").WinratesRowsBySlice} WinratesRowsBySlice
 */

/**
 * @typedef {{
 *   rowsBySlice: WinratesRowsBySlice;
 *   maxRowCount: number;
 *   error: string | null;
 *   updatedAt: string | null;
 * }} WinratesPageData
 */

/**
 * @param {string} language
 * @param {number} revalidate
 * @returns {Promise<WinratesPageData>}
 */
export async function loadWinratesPageData(language = "ru_ru", revalidate = 60) {
  try {
    const { historyPath, updatedAtPath } = buildStatsPaths(language);

    const updatedJson = await fetchApiJson(updatedAtPath, {
      fetchOptions: { next: { revalidate } },
    });

    const updatedAt =
      typeof updatedJson?.updatedAt === "string" ? updatedJson.updatedAt : null;

    const snapshotPath = updatedAt
      ? `${historyPath}?updatedAt=${encodeURIComponent(updatedAt)}`
      : historyPath;

    const histJson = await fetchApiJson(snapshotPath, {
      fetchOptions: { next: { revalidate } },
    });

    return {
      rowsBySlice:
        histJson && typeof histJson === "object" && "rowsBySlice" in histJson
          ? histJson.rowsBySlice
          : {},
      maxRowCount:
        histJson && typeof histJson === "object" && typeof histJson.maxRowCount === "number"
          ? histJson.maxRowCount
          : 0,
      updatedAt,
      error: null,
    };
  } catch (error) {
    console.error("Winrates page load error:", error);
    return {
      rowsBySlice: {},
      maxRowCount: 0,
      updatedAt: null,
      error: "Не удалось загрузить статистику винрейтов.",
    };
  }
}
