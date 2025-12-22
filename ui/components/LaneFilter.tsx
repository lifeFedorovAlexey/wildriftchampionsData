"use client";

import React from "react";
import { LANE_OPTIONS } from "@/components/screensConstants";
import { RoleIcon } from "./RoleIcon";

export type LaneKey = (typeof LANE_OPTIONS)[number]["key"];

type LaneFilterProps<T extends string = LaneKey> = {
  value: T;
  onChange: (key: T) => void;
  options?: ReadonlyArray<{ key: T; label: string }>;
};

export function LaneFilter<T extends string = LaneKey>({
  value,
  onChange,
  options = LANE_OPTIONS as unknown as ReadonlyArray<{ key: T; label: string }>,
}: LaneFilterProps<T>) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        justifyContent: "center",
        marginTop: "14px",
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
            <RoleIcon
              laneKey={opt.key as "top" | "jungle" | "mid" | "adc" | "support"}
              size={30}
            />
          </button>
        );
      })}
    </div>
  );
}

export default LaneFilter;
