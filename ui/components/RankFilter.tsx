"use client";

import React from "react";
import { RANK_OPTIONS } from "./screensConstants";
import { PillButton, PillGroup } from "./ui/PillGroup";

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
    <PillGroup>
      {options.map((opt) => {
        const active = opt.key === value;

        return (
          <PillButton
            key={opt.key}
            active={active}
            onClick={() => onChange(opt.key)}
          >
            {opt.label}
          </PillButton>
        );
      })}
    </PillGroup>
  );
}

export default RankFilter;
