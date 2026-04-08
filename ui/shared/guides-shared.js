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

const CP1251_EXTENDED_CHARS = [
  "Ђ", "Ѓ", "‚", "ѓ", "„", "…", "†", "‡", "€", "‰", "Љ", "‹", "Њ", "Ќ", "Ћ", "Џ",
  "ђ", "‘", "’", "“", "”", "•", "–", "—", "", "™", "љ", "›", "њ", "ќ", "ћ", "џ",
  " ", "Ў", "ў", "Ј", "¤", "Ґ", "¦", "§", "Ё", "©", "Є", "«", "¬", "­", "®", "Ї",
  "°", "±", "І", "і", "ґ", "µ", "¶", "·", "ё", "№", "є", "»", "ј", "Ѕ", "ѕ", "ї",
];

const CP1251_REVERSE_MAP = (() => {
  const map = new Map();

  for (let index = 0; index < 128; index += 1) {
    map.set(String.fromCharCode(index), index);
  }

  CP1251_EXTENDED_CHARS.forEach((char, index) => {
    if (char) {
      map.set(char, 0x80 + index);
    }
  });

  for (let index = 0; index < 32; index += 1) {
    map.set(String.fromCharCode(0x0410 + index), 0xc0 + index);
    map.set(String.fromCharCode(0x0430 + index), 0xe0 + index);
  }

  return map;
})();

function repairGuideText(value = "") {
  const source = String(value || "");

  if (!/[РСЁёЃѓ„…†‡€‰Љ‹ЊЌЋЏђ‘’“”•–—™љ›њќћџЎўЈҐЁЄЇІіґ№єјЅѕї]/.test(source)) {
    return source;
  }

  const bytes = [];

  for (const char of source) {
    const byte = CP1251_REVERSE_MAP.get(char);
    if (typeof byte !== "number") {
      return source;
    }
    bytes.push(byte);
  }

  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes));
    return decoded || source;
  } catch {
    return source;
  }
}

function normalizeGuideText(value = "") {
  return repairGuideText(value).trim().toLowerCase();
}

function containsGuideArchetypeTerm(value = "") {
  const normalized = normalizeGuideText(value);

  return (
    normalized.includes("marksman") ||
    normalized.includes("стрелок") ||
    normalized.includes("mage") ||
    normalized.includes("маг") ||
    normalized.includes("assassin") ||
    normalized.includes("убийца") ||
    normalized.includes("tank") ||
    normalized.includes("танк") ||
    normalized.includes("fighter") ||
    normalized.includes("warrior") ||
    normalized.includes("воин")
  );
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
  if (
    normalized.includes("top") ||
    normalized.includes("solo") ||
    normalized.includes("baron") ||
    normalized.includes("барон") ||
    normalized.includes("топ")
  ) return "Барон";
  if (
    normalized.includes("duo") ||
    normalized.includes("дуо") ||
    normalized.includes("dragon") ||
    normalized.includes("дракон") ||
    normalized.includes("adc") ||
    normalized.includes("адк")
  ) return "Дракон";
  if (normalized.includes("marksman") || normalized.includes("стрелок")) return "Стрелок";
  if (normalized.includes("mage") || normalized.includes("маг")) return "Маг";
  if (normalized.includes("assassin") || normalized.includes("убийца")) return "Убийца";
  if (normalized.includes("tank") || normalized.includes("танк")) return "Танк";
  if (normalized.includes("fighter") || normalized.includes("warrior") || normalized.includes("воин")) return "Воин";

  return repairGuideText(value).trim();
}

function localizeGuideLane(value = "") {
  const laneKey = toGuideLaneKey(value);

  if (laneKey === "support") return "Саппорт";
  if (laneKey === "mid") return "Мид";
  if (laneKey === "jungle") return "Лес";
  if (laneKey === "top") return "Барон";
  if (laneKey === "adc") return "Дракон";

  return "";
}

function toGuideLaneKey(value = "") {
  const normalized = normalizeGuideText(value);

  if (!normalized) return null;
  if (containsGuideArchetypeTerm(normalized)) return null;
  if (normalized.includes("support") || normalized.includes("саппорт") || normalized.includes("поддерж")) return "support";
  if (normalized.includes("mid") || normalized.includes("мид")) return "mid";
  if (normalized.includes("jungle") || normalized.includes("лес")) return "jungle";
  if (
    normalized.includes("top") ||
    normalized.includes("solo") ||
    normalized.includes("baron") ||
    normalized.includes("барон") ||
    normalized.includes("топ")
  ) return "top";
  if (
    normalized.includes("duo") ||
    normalized.includes("дуо") ||
    normalized.includes("dragon") ||
    normalized.includes("дракон") ||
    normalized.includes("adc") ||
    normalized.includes("адк")
  ) return "adc";

  return null;
}

module.exports = {
  SLUG_RIOT_REMAP,
  WILDRIFTFIRE_GUIDE_SLUG_ALIASES,
  RIOT_CHAMPION_SLUG_ALIASES,
  mapToRiotSlug,
  mapToLocalSlug,
  getGuideSlugAliases,
  repairGuideText,
  normalizeGuideText,
  localizeGuideRole,
  localizeGuideLane,
  toGuideLaneKey,
};
