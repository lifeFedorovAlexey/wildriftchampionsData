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
    <>
      <div className="rankFilter">
        {options.map((opt) => {
          const active = opt.key === value;

          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              className={`chip${active ? " active" : ""}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .rankFilter {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }

        .chip {
          min-height: 32px;
          padding: 6px 12px;
          border-radius: 999px;
          border: 1px solid rgba(71, 85, 105, 0.72);
          background: rgba(15, 23, 42, 0.42);
          color: var(--text-strong);
          font-size: 12px;
          font-weight: 600;
          line-height: 1;
          cursor: pointer;
        }

        .chip:hover {
          border-color: rgba(125, 211, 252, 0.34);
        }

        .chip.active {
          border-color: rgba(129, 140, 248, 0.9);
          background: rgba(67, 56, 202, 0.28);
          box-shadow: inset 0 0 0 1px rgba(191, 219, 254, 0.08);
        }

        @media (min-width: 1024px) {
          .chip {
            min-height: 34px;
            padding: 7px 13px;
          }
        }
      `}</style>
    </>
  );
}

export default RankFilter;
