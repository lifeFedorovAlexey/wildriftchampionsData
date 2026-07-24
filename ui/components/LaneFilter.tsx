"use client";

import React from "react";
import { LANE_OPTIONS } from "@/components/screensConstants";
import { RoleIcon } from "./RoleIcon";
import { PillButton, PillGroup } from "./ui/PillGroup";

export type LaneKey = (typeof LANE_OPTIONS)[number]["key"];

type LaneFilterProps<T extends string = LaneKey> = {
  value: T;
  onChange: (key: T) => void;
  options?: ReadonlyArray<{ key: T; label: string }>;
  disabledKeys?: ReadonlyArray<T>;
};

export function LaneFilter<T extends string = LaneKey>({
  value,
  onChange,
  options = LANE_OPTIONS as unknown as ReadonlyArray<{ key: T; label: string }>,
  disabledKeys = [],
}: LaneFilterProps<T>) {
  return (
    <PillGroup>
      {options.map((opt) => {
        const active = opt.key === value;
        const disabled = disabledKeys.includes(opt.key);
        const isIconLane = ["top", "jungle", "mid", "adc", "support"].includes(
          String(opt.key),
        );

        return (
          <PillButton
            key={opt.key}
            active={active}
            disabled={disabled}
            iconOnly={isIconLane}
            onClick={() => onChange(opt.key)}
            title={disabled ? "Нет статистики по чемпиону" : opt.label}
            aria-label={opt.label}
          >
            {isIconLane ? (
              <RoleIcon
                laneKey={opt.key as "top" | "jungle" | "mid" | "adc" | "support"}
                size={30}
              />
            ) : (
              opt.label
            )}
          </PillButton>
        );
      })}
    </PillGroup>
  );
}

export default LaneFilter;
