// ui/src/components/MenuButton.jsx
export default function MenuButton({
  title,
  subtitle,
  onClick,
  gradient,
  rightIcon = "→",
  leftIcon = null,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: "none",
        cursor: "pointer",
        background:
          gradient ||
          "linear-gradient(135deg, rgba(56,189,248,0.16), rgba(129,140,248,0.32))",
        color: "inherit",
        textAlign: "left",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}
      >
        {leftIcon ? (
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              background: "rgba(0,0,0,0.14)",
              border: "1px solid rgba(255,255,255,0.14)",
              flex: "0 0 auto",
            }}
          >
            {leftIcon}
          </span>
        ) : null}

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div style={{ fontSize: 12, opacity: 0.85 }}>{subtitle}</div>
          ) : null}
        </div>
      </div>

      <span style={{ fontSize: 18, opacity: 0.8 }}>{rightIcon}</span>
    </button>
  );
}
