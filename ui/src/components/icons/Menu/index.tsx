/* ---------- Menu icons (LoL/Wild Rift vibe, mono via currentColor) ---------- */

export function IconWinrate({ size = 22 }) {
  // podium 1-2-3 (winrate / ranking)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block" }}
    >
      {/* left step (2) */}
      <rect x="3" y="12" width="5" height="7" rx="1.5" />
      {/* center step (1) */}
      <rect x="9.5" y="8" width="5" height="11" rx="1.5" />
      {/* right step (3) */}
      <rect x="16" y="14" width="5" height="5" rx="1.5" />
    </svg>
  );
}

export function IconTierInq({ size = 22 }) {
  // crown
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block" }}
    >
      <path d="M3 7l4 4 5-6 5 6 4-4v10H3V7zm0 12h18v2H3v-2z" />
    </svg>
  );
}

export function IconTierlist({ size = 22 }) {
  // Great Wall (CN tierlist)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block" }}
    >
      {/* wall base */}
      <rect x="2" y="12" width="20" height="5" rx="1.2" />

      {/* battlements */}
      <rect x="3" y="9" width="4" height="3" rx="0.8" />
      <rect x="10" y="9" width="4" height="3" rx="0.8" />
      <rect x="17" y="9" width="4" height="3" rx="0.8" />
    </svg>
  );
}

export function IconPicksBans({ size = 22 }) {
  // sniper crosshair (pick / ban target)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block" }}
    >
      {/* outer ring */}
      <circle
        cx="12"
        cy="12"
        r="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />

      {/* vertical line */}
      <line
        x1="12"
        y1="3"
        x2="12"
        y2="7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="17"
        x2="12"
        y2="21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* horizontal line */}
      <line
        x1="3"
        y1="12"
        x2="7"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="17"
        y1="12"
        x2="21"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* center dot */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function IconTrends({ size = 22 }) {
  // rising chart
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block" }}
    >
      <path d="M3 17l6-6 4 4 7-7v4h2V4h-8v2h4l-5 5-4-4-7 7z" />
    </svg>
  );
}
