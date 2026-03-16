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
    <>
      <div className="laneFilter">
        {options.map((opt) => {
          const active = opt.key === value;

          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              title={opt.label}
              aria-label={opt.label}
              className={`laneButton${active ? " active" : ""}`}
            >
              <RoleIcon
                laneKey={opt.key as "top" | "jungle" | "mid" | "adc" | "support"}
                size={30}
              />
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .laneFilter {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          margin-top: 2px;
        }

        .laneButton {
          width: 46px;
          height: 46px;
          border-radius: 999px;
          border: 1px solid rgba(71, 85, 105, 0.72);
          background: rgba(15, 23, 42, 0.42);
          color: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        .laneButton:hover {
          border-color: rgba(134, 239, 172, 0.38);
        }

        .laneButton.active {
          border-color: rgba(74, 222, 128, 0.88);
          background: rgba(22, 101, 52, 0.28);
          box-shadow: inset 0 0 0 1px rgba(220, 252, 231, 0.08);
        }

        @media (min-width: 1024px) {
          .laneButton {
            width: 48px;
            height: 48px;
          }
        }
      `}</style>
    </>
  );
}

export default LaneFilter;
