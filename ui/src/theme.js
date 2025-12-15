export const baseFontFamily =
  "system-ui,-apple-system,BlinkMacSystemFont,sans-serif";

export const styles = {
  app: (bg, color) => ({
    minHeight: "100vh",
    padding: "10px 10px 12px",
    background: bg,
    color,
    fontFamily: baseFontFamily,
    boxSizing: "border-box",
  }),
  menuWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.75,
    marginBottom: 6,
  },
  futureBlock: (hintColor) => ({
    marginTop: 12,
    padding: "8px 10px",
    borderRadius: 10,
    background: "rgba(15,23,42,0.7)",
    fontSize: 12,
    color: hintColor,
  }),
};

// Цвета по умолчанию (если Telegram не передал themeParams)
export const BASE_COLORS = {
  background: "#050816",
  text: "#ffffff",
  hint: "#9ca3af",
};

// Читаемые градиенты для кнопок меню
export const BUTTON_GRADIENTS = {
  blue: "linear-gradient(135deg, rgba(56,189,248,0.16), rgba(129,140,248,0.32))",
  green:
    "linear-gradient(135deg, rgba(16,185,129,0.16), rgba(52,211,153,0.32))",
  purple:
    "linear-gradient(135deg, rgba(139,92,246,0.18), rgba(168,85,247,0.3))",

  gold: "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(251,191,36,0.34))",
  crimson:
    "linear-gradient(135deg, rgba(239,68,68,0.18), rgba(248,113,113,0.34))",
};

// Универсальная функция: берём цвет из Telegram или fallback
export function resolveTgColor(tg, paramName, fallback) {
  return tg?.themeParams?.[paramName] || fallback;
}
