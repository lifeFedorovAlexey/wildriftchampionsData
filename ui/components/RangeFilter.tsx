"use client";

type RangeValue = "week" | "month" | "all";

type Props = {
  value: RangeValue;
  onChange: (v: RangeValue) => void;
};

export default function RangeFilter({ value, onChange }: Props) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: 8,
        flexWrap: "wrap",
        marginTop: 12,
        marginBottom: 12,

        /* ключевой момент — фиксируем высоту строки */
        minHeight: 28,
      }}
    >
      <RangeBtn active={value === "week"} onClick={() => onChange("week")}>
        Неделя
      </RangeBtn>

      <RangeBtn active={value === "month"} onClick={() => onChange("month")}>
        Месяц
      </RangeBtn>

      <RangeBtn active={value === "all"} onClick={() => onChange("all")}>
        Всё
      </RangeBtn>
    </div>
  );
}

/* ---------- локальная кнопка ---------- */

function RangeBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        boxSizing: "border-box",
        minWidth: 70,
        height: 28,
        padding: "4px 8px",

        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        cursor: "pointer",

        border: active
          ? "1px solid rgba(59,130,246,0.95)"
          : "1px solid rgba(75,85,99,0.9)",

        background: active ? "rgba(37,99,235,0.25)" : "rgba(15,23,42,0.95)",

        color: active ? "#e5e7eb" : "#9ca3af",

        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",

        userSelect: "none",
      }}
    >
      {children}
    </button>
  );
}
