// ui/src/components/LaneFilter.jsx
import React from "react";
import { LANE_OPTIONS } from "../screens/constants";
import { RoleIcon } from "./RoleIcon";

/**
 * value: string         // текущий laneKey
 * onChange: (key) => void
 * options?: массив опций, по умолчанию LANE_OPTIONS
 */
export function LaneFilter({ value, onChange, options = LANE_OPTIONS }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        justifyContent: "center",
      }}
    >
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            title={opt.label}
            style={{
              borderRadius: 999,
              border: active
                ? "1px solid rgba(52,211,153,1)"
                : "1px solid rgba(31,41,55,1)",
              background: active ? "rgba(16,185,129,0.25)" : "transparent",
              padding: "4px 8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <RoleIcon laneKey={opt.key} size={30} />
          </button>
        );
      })}
    </div>
  );
}

export default LaneFilter;
