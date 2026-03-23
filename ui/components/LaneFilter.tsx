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
};

export function LaneFilter<T extends string = LaneKey>({
  value,
  onChange,
  options = LANE_OPTIONS as unknown as ReadonlyArray<{ key: T; label: string }>,
}: LaneFilterProps<T>) {
  return (
    <PillGroup>
      {options.map((opt) => {
        const active = opt.key === value;

        return (
          <PillButton
            key={opt.key}
            active={active}
            iconOnly
            onClick={() => onChange(opt.key)}
            title={opt.label}
            aria-label={opt.label}
          >
            <RoleIcon
              laneKey={opt.key as "top" | "jungle" | "mid" | "adc" | "support"}
              size={30}
            />
          </PillButton>
        );
      })}
    </PillGroup>
  );
}

export default LaneFilter;
