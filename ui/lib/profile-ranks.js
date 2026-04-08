const PEAK_RANK_OPTIONS = [
  { value: "", label: "Не выбран" },
  { value: "iron", label: "Железо" },
  { value: "bronze", label: "Бронза" },
  { value: "silver", label: "Серебро" },
  { value: "gold", label: "Золото" },
  { value: "platinum", label: "Платина" },
  { value: "emerald", label: "Изумруд" },
  { value: "diamond", label: "Алмаз" },
  { value: "master", label: "Мастер" },
  { value: "grandmaster", label: "Грандмастер" },
  { value: "challenger", label: "Претендент" },
  { value: "sovereign", label: "Суверен" },
];

const PEAK_RANK_LABELS = Object.fromEntries(
  PEAK_RANK_OPTIONS.filter((option) => option.value).map((option) => [option.value, option.label]),
);

function trimTrailingSlash(value = "") {
  return String(value || "").replace(/\/+$/, "");
}

export function getPeakRankOptions() {
  return PEAK_RANK_OPTIONS;
}

export function getPeakRankLabel(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return PEAK_RANK_LABELS[normalized] || "";
}

export function buildPeakRankIconUrl(value, env = process.env) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!PEAK_RANK_LABELS[normalized]) return null;

  const publicBaseUrl = trimTrailingSlash(env?.S3_PUBLIC_BASE_URL || "");
  if (!publicBaseUrl) return null;

  return `${publicBaseUrl}/assets/profile-rank-${normalized}.png`;
}
