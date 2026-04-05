const SLUG_RIOT_REMAP = {
  nunu: "nunu-willump",
  monkeyking: "wukong",
  xinzhao: "xin-zhao",
  aurelionsol: "aurelion-sol",
  jarvaniv: "jarvan-iv",
  leesin: "lee-sin",
  drmundo: "dr-mundo",
  missfortune: "miss-fortune",
  twistedfate: "twisted-fate",
  masteryi: "master-yi",
};

const WILDRIFTFIRE_GUIDE_SLUG_ALIASES = {
  nunu: "nunu-amp-willump",
  monkeyking: "wukong",
  xinzhao: "xin-zhao",
  aurelionsol: "aurelion-sol",
  jarvaniv: "jarvan-iv",
  leesin: "lee-sin",
  drmundo: "dr-mundo",
  missfortune: "miss-fortune",
  twistedfate: "twisted-fate",
  masteryi: "master-yi",
};

const RIOT_CHAMPION_SLUG_ALIASES = {
  nunu: ["nunu", "nunu-and-willump", "nunu-willump"],
  monkeyking: ["wukong"],
  xinzhao: ["xin-zhao"],
  aurelionsol: ["aurelion-sol"],
  jarvaniv: ["jarvan-iv"],
  leesin: ["lee-sin"],
  drmundo: ["dr-mundo", "doctor-mundo"],
  missfortune: ["miss-fortune"],
  twistedfate: ["twisted-fate"],
  masteryi: ["master-yi"],
};

const SLUG_LOCAL_REMAP = Object.fromEntries(
  Object.entries(SLUG_RIOT_REMAP).map(([localSlug, riotSlug]) => [riotSlug, localSlug]),
);

function normalizeGuideText(value = "") {
  return String(value || "").trim().toLowerCase();
}

function mapToRiotSlug(value = "") {
  const normalized = String(value || "").trim();
  return SLUG_RIOT_REMAP[normalized] ?? normalized;
}

function mapToLocalSlug(value = "") {
  const normalized = String(value || "").trim();
  return SLUG_LOCAL_REMAP[normalized] ?? normalized;
}

function getGuideSlugAliases(value = "") {
  const normalized = String(value || "").trim();
  if (!normalized) return [];

  return Array.from(
    new Set([
      normalized,
      mapToRiotSlug(normalized),
      mapToLocalSlug(normalized),
    ].filter(Boolean)),
  );
}

function localizeGuideRole(value = "") {
  const normalized = normalizeGuideText(value);

  if (!normalized) return "";
  if (/^build\s*\d+$/i.test(normalized) || /^guide\s*\d+$/i.test(normalized)) return "";
  if (normalized.includes("support") || normalized.includes("саппорт") || normalized.includes("поддерж")) return "Саппорт";
  if (normalized.includes("mid") || normalized.includes("мид")) return "Мид";
  if (normalized.includes("jungle") || normalized.includes("лес")) return "Лес";
  if (normalized.includes("solo") || normalized.includes("baron") || normalized.includes("барон") || normalized.includes("топ")) return "Барон";
  if (normalized.includes("duo") || normalized.includes("adc") || normalized.includes("адк")) return "АДК";
  if (normalized.includes("marksman") || normalized.includes("стрелок")) return "Стрелок";
  if (normalized.includes("mage") || normalized.includes("маг")) return "Маг";
  if (normalized.includes("assassin") || normalized.includes("убийца")) return "Убийца";
  if (normalized.includes("tank") || normalized.includes("танк")) return "Танк";
  if (normalized.includes("fighter") || normalized.includes("warrior") || normalized.includes("воин")) return "Воин";

  return String(value || "").trim();
}

function localizeGuideLane(value = "") {
  const laneKey = toGuideLaneKey(value);

  if (laneKey === "support") return "Саппорт";
  if (laneKey === "mid") return "Мид";
  if (laneKey === "jungle") return "Лес";
  if (laneKey === "top") return "Барон";
  if (laneKey === "adc") return "Дракон";

  return String(value || "").trim();
}

function toGuideLaneKey(value = "") {
  const normalized = normalizeGuideText(value);

  if (!normalized) return null;
  if (normalized.includes("support") || normalized.includes("саппорт") || normalized.includes("поддерж")) return "support";
  if (normalized.includes("mid") || normalized.includes("мид")) return "mid";
  if (normalized.includes("jungle") || normalized.includes("лес")) return "jungle";
  if (normalized.includes("solo") || normalized.includes("baron") || normalized.includes("барон") || normalized.includes("топ")) return "top";
  if (
    normalized.includes("duo") ||
    normalized.includes("adc") ||
    normalized.includes("дракон") ||
    normalized.includes("адк") ||
    normalized.includes("marksman") ||
    normalized.includes("стрелок")
  ) return "adc";

  return null;
}

function inferGuideLaneKeysFromRole(value = "") {
  const normalized = normalizeGuideText(value);
  if (!normalized) return [];

  const lanes = new Set();
  if (normalized.includes("marksman") || normalized.includes("стрелок")) lanes.add("adc");
  if (normalized.includes("support") || normalized.includes("саппорт") || normalized.includes("поддерж") || normalized.includes("enchanter")) lanes.add("support");
  if (normalized.includes("mage") || normalized.includes("маг")) lanes.add("mid");
  if (normalized.includes("assassin") || normalized.includes("убийца")) {
    lanes.add("mid");
    lanes.add("jungle");
  }
  if (normalized.includes("fighter") || normalized.includes("warrior") || normalized.includes("воин")) {
    lanes.add("top");
    lanes.add("jungle");
  }
  if (normalized.includes("tank") || normalized.includes("танк")) {
    lanes.add("top");
    lanes.add("jungle");
    lanes.add("support");
  }

  return Array.from(lanes);
}

module.exports = {
  SLUG_RIOT_REMAP,
  WILDRIFTFIRE_GUIDE_SLUG_ALIASES,
  RIOT_CHAMPION_SLUG_ALIASES,
  mapToRiotSlug,
  mapToLocalSlug,
  getGuideSlugAliases,
  normalizeGuideText,
  localizeGuideRole,
  localizeGuideLane,
  toGuideLaneKey,
  inferGuideLaneKeysFromRole,
};
