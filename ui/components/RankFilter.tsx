"use client";

import React from "react";
import { RANK_OPTIONS } from "./screensConstants";
import styles from "./RankFilter.module.css";

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
    <div className={styles.rankFilter}>
      {options.map((opt) => {
        const active = opt.key === value;

        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`${styles.chip} ${active ? styles.active : ""}`.trim()}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default RankFilter;
