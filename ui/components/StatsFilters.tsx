"use client";

import type { ReactNode } from "react";

import LaneFilter from "@/components/LaneFilter";
import RankFilter from "@/components/RankFilter";
import styles from "./StatsFilters.module.css";

type Option<T extends string> = {
  key: T;
  label: string;
};

type LaneOption<T extends string> = {
  key: T;
  label: string;
};

type Props<TRank extends string, TLane extends string> = {
  rankValue: TRank;
  onRankChange: (key: TRank) => void;
  laneValue: TLane;
  onLaneChange: (key: TLane) => void;
  rankOptions?: ReadonlyArray<Option<TRank>>;
  laneOptions?: ReadonlyArray<LaneOption<TLane>>;
  extraControls?: ReactNode;
  compact?: boolean;
};

export default function StatsFilters<TRank extends string, TLane extends string>({
  rankValue,
  onRankChange,
  laneValue,
  onLaneChange,
  rankOptions,
  laneOptions,
  extraControls,
  compact = false,
}: Props<TRank, TLane>) {
  const className = compact
    ? `${styles.shell} ${styles.compact}`
    : styles.shell;

  return (
    <section className={className}>
      <div className={styles.row}>
        <RankFilter
          value={rankValue}
          onChange={onRankChange}
          options={rankOptions}
        />
      </div>

      <div className={styles.row}>
        <LaneFilter
          value={laneValue}
          onChange={onLaneChange}
          options={laneOptions}
        />
      </div>

      {extraControls ? <div className={styles.extra}>{extraControls}</div> : null}
    </section>
  );
}
