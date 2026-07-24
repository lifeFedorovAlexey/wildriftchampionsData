"use client";

import React from "react";
import { RANK_OPTIONS } from "./screensConstants";
import { PillButton, PillGroup } from "./ui/PillGroup";

export type RankKey = (typeof RANK_OPTIONS)[number]["key"];

type RankFilterProps<T extends string = RankKey> = {
  value: T;
  onChange: (key: T) => void;
  options?: ReadonlyArray<{ key: T; label: string }>;
  disabledKeys?: ReadonlyArray<T>;
};

export function RankFilter<T extends string = RankKey>({
  value,
  onChange,
  options = RANK_OPTIONS as unknown as ReadonlyArray<{ key: T; label: string }>,
  disabledKeys = [],
}: RankFilterProps<T>) {
  return (
    <PillGroup>
      {options.map((opt) => {
        const active = opt.key === value;
        const disabled = disabledKeys.includes(opt.key);

        return (
          <PillButton
            key={opt.key}
            active={active}
            disabled={disabled}
            onClick={() => onChange(opt.key)}
            title={disabled ? "Нет статистики по чемпиону" : opt.label}
          >
            {opt.label}
          </PillButton>
        );
      })}
    </PillGroup>
  );
}

export default RankFilter;
