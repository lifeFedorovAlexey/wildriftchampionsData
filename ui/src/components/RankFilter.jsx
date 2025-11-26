// ui/src/components/RankFilter.jsx
import React from "react";
import { RANK_OPTIONS } from "../screens/constants";

/**
 * value: string         // текущий rankKey
 * onChange: (key) => void
 * options?: массив опций, по умолчанию RANK_OPTIONS
 */
export function RankFilter({ value, onChange, options = RANK_OPTIONS }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        justifyContent: "center",
        marginBottom: 4,
      }}
    >
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            style={{
              borderRadius: 999,
              border: active
                ? "1px solid rgba(96,165,250,1)"
                : "1px solid rgba(31,41,55,1)",
              background: active ? "rgba(37,99,235,0.3)" : "transparent",
              padding: "4px 8px",
              fontSize: 11,
              cursor: "pointer",
              color: "inherit",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default RankFilter;
