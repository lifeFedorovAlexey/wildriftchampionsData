"use client";

import React from "react";
import { LANE_OPTIONS } from "@/components/screensConstants";
import { RoleIcon } from "./RoleIcon";
import styles from "./LaneFilter.module.css";

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
    <div className={styles.laneFilter}>
      {options.map((opt) => {
        const active = opt.key === value;

        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            title={opt.label}
            aria-label={opt.label}
            className={`${styles.laneButton} ${active ? styles.active : ""}`.trim()}
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
