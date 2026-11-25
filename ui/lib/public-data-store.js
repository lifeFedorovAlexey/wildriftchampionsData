import fs from "node:fs/promises";
import path from "node:path";
import { isPublicSnapshotPath } from "./stats-api-origin.js";

export const PUBLIC_DATA_SCHEMA = "wildrift-public-snapshot";
export const PUBLIC_DATA_VERSION = 1;

const DEFAULT_PUBLIC_DATA_DIR = path.join(process.cwd(), "public-data");
const LANES = new Set(["top", "jungle", "mid", "adc", "support"]);
const TIER_KEYS = ["S+", "S", "A", "B", "C", "D"];

function publicDataRoot(env = process.env) {
  return path.resolve(String(env.PUBLIC_DATA_DIR || DEFAULT_PUBLIC_DATA_DIR));
}

function safeSegment(value) {
  const normalized = String(value || "").trim();
  if (!normalized || normalized === "." || normalized === "..") return null;
  return encodeURIComponent(normalized);
}

function toDateString(value) {
  if (!value) return null;
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function isValidDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && toDateString(value) === value;
}

function queryValue(query, key) {
  if (query instanceof URLSearchParams) return query.get(key);
  return query?.[key] ?? null;
}

function splitListParam(value, maxItems) {
  if (typeof value !== "string" || !value.trim()) return null;
  const items = value.split(",").map((item) => item.trim()).filter(Boolean);
  if (items.length > maxItems) return { error: "Too many values" };
  return items.length ? items : null;
}

function parseDateParam(value) {
  if (value == null || value === "") return null;
  if (!isValidDate(value)) return { error: "Invalid date format. Use YYYY-MM-DD." };
  return value;
}

async function resolveCurrentRelease(rootDir) {
  const currentPath = path.join(rootDir, "current");
  const releaseDir = await fs.realpath(currentPath).catch(() => null);
  if (!releaseDir) {
    throw new Error(`Public data current release is missing: ${currentPath}`);
  }

  const root = path.resolve(releaseDir);
  const manifestPath = path.join(root, "manifest.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  if (manifest?.schema !== PUBLIC_DATA_SCHEMA || manifest?.version !== PUBLIC_DATA_VERSION) {
    throw new Error("Unsupported public data snapshot");
  }

  return { root, manifest };
}

async function readJsonFile(release, relativePath) {
  const root = path.resolve(release.root);
  const target = path.resolve(root, relativePath);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
    throw new Error("Invalid public data path");
  }
  return JSON.parse(await fs.readFile(target, "utf8"));
}

async function readNamed(release, name, relativePath) {
  const metadata = release.manifest?.datasets?.[name];
  if (metadata?.file && metadata.file !== relativePath) {
    throw new Error(`Snapshot dataset path mismatch for ${name}`);
  }
  return await readJsonFile(release, relativePath);
}

function mapChampionsFields(full, fields) {
  if (fields === "names") return full.map((item) => ({ slug: item.slug, name: item.name }));
  if (fields === "index") {
    return full.map((item) => ({
      slug: item.slug,
      name: item.name,
      roles: Array.isArray(item.roles) ? item.roles : [],
      iconUrl: item.icon || null,
    }));
  }
  return full;
}

function filterHistoryPayload(payload, latestPayload, query) {
  const slugValue = queryValue(query, "slug");
  const safeSlug = typeof slugValue === "string" && slugValue.trim() ? slugValue.trim() : null;
  if (safeSlug && safeSlug.length > 64) return { status: 400, payload: { error: "Invalid slug" } };

  const rank = splitListParam(queryValue(query, "rank"), 10);
  const lane = splitListParam(queryValue(query, "lane"), 10);
  if (rank?.error || lane?.error) return { status: 400, payload: { error: "Bad Request" } };

  const date = parseDateParam(queryValue(query, "date"));
  if (date?.error) return { status: 400, payload: { error: "Bad Request" } };
  const fromParam = date || parseDateParam(queryValue(query, "from"));
  if (fromParam?.error) return { status: 400, payload: { error: "Bad Request" } };
  const toParam = date || parseDateParam(queryValue(query, "to"));
  if (toParam?.error) return { status: 400, payload: { error: "Bad Request" } };

  const wantLatest = ["1", "true"].includes(String(queryValue(query, "latest")));
  let from = fromParam || null;
  let to = toParam || null;
  if (wantLatest && !from && !to) {
    const latest = toDateString(latestPayload?.filters?.date);
    from = latest;
    to = latest;
  }

  const items = (Array.isArray(payload?.items) ? payload.items : []).filter((item) => {
    if (safeSlug && item.slug !== safeSlug) return false;
    if (rank && !rank.includes(item.rank)) return false;
    if (lane && !lane.includes(item.lane)) return false;
    if (from && String(item.date) < from) return false;
    if (to && String(item.date) > to) return false;
    return true;
  });

  const wantAvailability = Boolean(safeSlug)
    && ["1", "true"].includes(String(queryValue(query, "availability")));
  const availability = wantAvailability
    ? Array.from(new Map(
      (payload?.items || [])
        .filter((item) => item.slug === safeSlug && item.rank && item.lane)
        .map((item) => [`${item.rank}:${item.lane}`, { rank: item.rank, lane: item.lane }]),
    ).values())
    : undefined;

  return {
    status: 200,
    payload: {
      filters: {
        slug: safeSlug || null,
        rank,
        lane,
        from,
        to: to || (from && !to ? from : to),
        latest: wantLatest || null,
      },
      count: items.length,
      items,
      ...(wantAvailability ? { availability } : {}),
    },
  };
}

function filterTrendEvents(payload, from, to) {
  return {
    patches: (Array.isArray(payload?.patches) ? payload.patches : [])
      .filter((item) => (!from || item.date >= from) && (!to || item.date <= to)),
    seasons: (Array.isArray(payload?.seasons) ? payload.seasons : [])
      .filter((item) => (!from || item.date >= from) && (!to || item.date <= to)),
  };
}

function buildTierlistPayload(bulk, query) {
  const rank = String(queryValue(query, "rank") || "diamondPlus").trim();
  const lane = String(queryValue(query, "lane") || "top").trim();
  const language = String(queryValue(query, "lang") || "ru_ru").trim();
  const bucket = bulk?.tiersByRankLane?.[`${rank}|${lane}`];
  const tiers = Object.fromEntries(TIER_KEYS.map((key) => [key, bucket?.tiers?.[key] || []]));
  return {
    filters: { rank, lane, date: bulk?.filters?.date || null, lang: language },
    tiersOrder: TIER_KEYS,
    tiers,
  };
}

export function isPublicDataMode(env = process.env) {
  return String(env.PUBLIC_DATA_MODE || "").trim().toLowerCase() === "snapshot";
}

export async function readPublicApi(pathname, query = new URLSearchParams(), env = process.env) {
  if (!isPublicDataMode(env) || !isPublicSnapshotPath(pathname)) return null;

  const release = await resolveCurrentRelease(publicDataRoot(env));
  const segments = String(pathname || "").split("/").filter(Boolean).map(decodeURIComponent);

  if (segments[0] !== "api") return null;

  if (segments[1] === "champions" && segments.length === 2) {
    const language = String(queryValue(query, "lang") || "ru_ru").replace("_", "-");
    const languageFile = language === "en-us" ? "en-us" : "ru-ru";
    const full = await readNamed(release, `champions:${languageFile.replace("-", "_")}`, `champions.${languageFile}.json`);
    const fields = queryValue(query, "fields");
    const fieldFile = fields === "names" || fields === "index" ? `champions.${languageFile}.${fields}.json` : null;
    const payload = fieldFile
      ? await readJsonFile(release, fieldFile)
      : mapChampionsFields(full, fields);
    return { status: 200, payload };
  }

  if (segments[1] === "updated-at" && segments.length === 2) {
    return { status: 200, payload: await readNamed(release, "updated-at", "updated-at.json") };
  }

  if (segments[1] === "latest-stats-snapshot" && segments.length === 2) {
    return { status: 200, payload: await readNamed(release, "latest-stats-snapshot", "latest-stats-snapshot.json") };
  }

  if (segments[1] === "winrates-snapshot" && segments.length === 2) {
    return { status: 200, payload: await readNamed(release, "winrates-snapshot", "winrates-snapshot.json") };
  }

  if (segments[1] === "champion-history" && segments.length === 2) {
    const payload = await readNamed(release, "champion-history", "champion-history.json");
    const latest = await readNamed(release, "latest-stats-snapshot", "latest-stats-snapshot.json");
    return filterHistoryPayload(payload, latest, query);
  }

  if (segments[1] === "tierlist-bulk" && segments.length === 2) {
    const language = String(queryValue(query, "lang") || "ru_ru").replace("_", "-") === "en-us" ? "en-us" : "ru-ru";
    return {
      status: 200,
      payload: await readNamed(release, `tierlist-bulk:${language.replace("-", "_")}`, `tierlist-bulk.${language}.json`),
    };
  }

  if (segments[1] === "tierlist" && segments.length === 2) {
    const language = String(queryValue(query, "lang") || "ru_ru").replace("_", "-") === "en-us" ? "en-us" : "ru-ru";
    const bulk = await readNamed(release, `tierlist-bulk:${language.replace("-", "_")}`, `tierlist-bulk.${language}.json`);
    return { status: 200, payload: buildTierlistPayload(bulk, query) };
  }

  if (segments[1] === "guides" && segments.length === 2) {
    const fields = queryValue(query, "fields");
    return {
      status: 200,
      payload: fields === "slug"
        ? await readNamed(release, "guides:slugs", "guides.slugs.json")
        : await readNamed(release, "guides", "guides.json"),
    };
  }

  if (segments[1] === "guides" && segments.length === 3) {
    const slug = safeSegment(segments[2]);
    if (!slug) return { status: 400, payload: { error: "Missing slug" } };
    try {
      return { status: 200, payload: await readJsonFile(release, `guides/${slug}.json`) };
    } catch (error) {
      if (error?.code === "ENOENT") return { status: 404, payload: { error: "Not Found" } };
      throw error;
    }
  }

  if (segments[1] === "patch-notes" && segments.length === 2) {
    return { status: 200, payload: await readNamed(release, "patch-notes", "patch-notes.json") };
  }

  if (segments[1] === "patch-notes" && segments.length === 3) {
    const version = safeSegment(segments[2]);
    if (!version) return { status: 400, payload: { error: "Not Found" } };
    try {
      return { status: 200, payload: await readJsonFile(release, `patch-notes/${version}.json`) };
    } catch (error) {
      if (error?.code === "ENOENT") return { status: 404, payload: { error: "Not Found" } };
      throw error;
    }
  }

  if (segments[1] === "trend-events" && segments.length === 2) {
    const slug = String(queryValue(query, "slug") || "").trim();
    const lane = String(queryValue(query, "lane") || "").trim();
    const from = queryValue(query, "from");
    const to = queryValue(query, "to");
    if (!/^[a-z0-9-]{1,80}$/.test(slug) || !LANES.has(lane) || !isValidDate(from) || !isValidDate(to) || from > to) {
      return { status: 400, payload: { error: "Bad Request" } };
    }
    const file = `trend-events/${safeSegment(slug)}/${safeSegment(lane)}.json`;
    try {
      const payload = await readJsonFile(release, file);
      return { status: 200, payload: filterTrendEvents(payload, from, to) };
    } catch (error) {
      if (error?.code === "ENOENT") return { status: 200, payload: { patches: [], seasons: [] } };
      throw error;
    }
  }

  return null;
}

