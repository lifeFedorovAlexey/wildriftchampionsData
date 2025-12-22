"use client";

import React from "react";
import { RANK_OPTIONS } from "./screensConstants";

export type RankKey = (typeof RANK_OPTIONS)[number]["key"];

type RankFilterProps<T extends string = RankKey> = {
  value: T;
  onChange: (key: T) => void;
  options?: ReadonlyArray<{ key: T; label: string }>;
};

export function RankFilter<T extends string = RankKey>({
  value,
  onChange,
  options = RANK_OPTIONS as unknown as ReadonlyArray<{ key: T; label: string }>,
}: RankFilterProps<T>) {
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
