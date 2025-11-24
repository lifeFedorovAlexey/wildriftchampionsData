// ui/src/components/MenuButton.jsx
export default function MenuButton({
  title,
  subtitle,
  onClick,
  gradient,
  rightIcon = "→",
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
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 2,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 12,
              opacity: 0.85,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      <span
        style={{
          fontSize: 18,
          opacity: 0.8,
        }}
      >
        {rightIcon}
      </span>
    </button>
  );
}
