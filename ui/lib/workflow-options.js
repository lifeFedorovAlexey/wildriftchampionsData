export const RANK_OPTIONS = [
  { key: "diamondPlus", label: "Алмаз" },
  { key: "masterPlus", label: "Мастер" },
  { key: "king", label: "ГМ" },
  { key: "peak", label: "Претендент" },
  { key: "overall", label: "Все" },
];

export const LANE_OPTIONS = [
  { key: "top", label: "Топ" },
  { key: "jungle", label: "Лес" },
  { key: "mid", label: "Мид" },
  { key: "adc", label: "Стрелок" },
  { key: "support", label: "Поддержка" },
];

function availableIds(items, field) {
  return new Set(items.flatMap((item) => (
    item && typeof item === "object" && typeof item[field] === "string"
      ? [item[field]]
      : []
  )));
}

export function buildWorkflowOptions(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.items) || !snapshot.items.length) {
    throw new Error("workflow_options_snapshot_unavailable");
  }

  const laneIds = availableIds(snapshot.items, "lane");
  const rankIds = availableIds(snapshot.items, "rank");
  const lanes = LANE_OPTIONS
    .filter((option) => laneIds.has(option.key))
    .map(({ key, label }) => ({ id: key, label }));
  const ranks = RANK_OPTIONS
    .filter((option) => rankIds.has(option.key))
    .map(({ key, label }) => ({ id: key, label }));

  if (!lanes.length || !ranks.length) {
    throw new Error("workflow_options_empty_snapshot");
  }

  return {
    version: 1,
    source: "wildriftallstats.ru",
    statsSnapshotId: snapshot.snapshotId ?? null,
    lanes,
    ranks,
  };
}
