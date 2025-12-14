// ui/src/components/styled/tokens.js

export const BREAKPOINTS = {
  desktop: 900,
  wide: 1280,
};

export const LAYOUT = {
  pageMax: 1180,
  pageMaxMobile: 980,
  padMobile: 0,
  padDesktop: 24,
};

export const COLORS = {
  cardBg: "rgba(15, 23, 42, 0.85)",
  cardBorder: "rgba(31, 41, 55, 0.9)",

  text: "#e5e7eb",
  muted: "#9ca3af",

  dangerBg: "rgba(64, 32, 32, 0.9)",
  dangerBorder: "rgba(248, 113, 113, 0.35)",

  pillBg: "rgba(15, 23, 42, 0.95)",
  pillBorder: "rgba(75, 85, 99, 0.9)",

  pillActiveBlueBorder: "rgba(59,130,246,0.95)",
  pillActiveBlueBg: "rgba(37,99,235,0.25)",

  pillActiveGreenBorder: "rgba(52,211,153,0.9)",
  pillActiveGreenBg: "rgba(16,185,129,0.2)",
};

export function mqMin(px) {
  return `@media (min-width: ${px}px)`;
}
