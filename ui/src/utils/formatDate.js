export function formatDateTime(input) {
  if (!input) return "...";

  const date = new Date(input);
  if (isNaN(date.getTime())) return "...";

  const d = date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const t = date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${d}, ${t}`;
}
