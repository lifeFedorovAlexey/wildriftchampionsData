export const CHART_LEFT = 56;
export const CHART_RIGHT = 8;

export function trendTimeDomain(days) {
  const first = days[0]?.ts || 0;
  const last = days[days.length - 1]?.ts || first;
  return first === last ? [first - 432e5, last + 432e5] : [first, last];
}

export function layoutPatchMarkers(patches, days, width) {
  const [from, to] = trendTimeDomain(days);
  const plotWidth = Math.max(0, width - CHART_LEFT - CHART_RIGHT);
  const rows = [];
  const markers = [...patches].sort((a, b) => a.date.localeCompare(b.date)).flatMap((patch) => {
    const ts = Date.parse(patch.date);
    if (!Number.isFinite(ts) || ts < from || ts > to) return [];
    const x = CHART_LEFT + ((ts - from) / (to - from)) * plotWidth;
    const markerWidth = Math.min(width, Math.max(56, Math.min(3, patch.changes.length) * 36 + 4));
    const left = Math.max(0, Math.min(width - markerWidth, x - markerWidth / 2));
    let row = rows.findIndex((right) => right + 8 <= left);
    if (row < 0) row = rows.length;
    rows[row] = left + markerWidth;
    return [{ ...patch, x, left, width: markerWidth, top: row * 68 }];
  });
  return { markers, height: rows.length ? rows.length * 68 + 8 : 0 };
}

export function eventTone(changeType) {
  return ({
    buff: { label: "Бафф", symbol: "↑", color: "#86efac" },
    nerf: { label: "Нерф", symbol: "↓", color: "#fb7185" },
    rework: { label: "Реворк", symbol: "↻", color: "#93c5fd" },
    adjustment: { label: "Изменение", symbol: "±", color: "#fcd34d" },
    new: { label: "Добавлен", symbol: "+", color: "#93c5fd" },
    removed: { label: "Удалён", symbol: "−", color: "#fb7185" },
  })[changeType] || { label: "Изменение", symbol: "±", color: "#fcd34d" };
}

export function eventDateLabel(value) {
  return new Date(value).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
}
