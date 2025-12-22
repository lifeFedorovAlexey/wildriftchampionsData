import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: ReactNode;
  href: string;
  gradient?: string;
  rightIcon?: ReactNode;
  leftIcon?: ReactNode;
};

export default function MenuButton({
  title,
  subtitle,
  href,
  gradient,
  rightIcon = "→",
  leftIcon = null,
}: Props) {
  return (
    <a
      href={href}
      style={{
        display: "block",
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.10)",
        cursor: "pointer",
        background:
          gradient ||
          "linear-gradient(135deg, rgba(56,189,248,0.16), rgba(129,140,248,0.32))",
        color: "inherit",
        textAlign: "left",
        textDecoration: "none",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 0,
          }}
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
                fontWeight: 700,
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

        <span style={{ fontSize: 18, opacity: 0.8, flex: "0 0 auto" }}>
          {rightIcon}
        </span>
      </div>
    </a>
  );
}
