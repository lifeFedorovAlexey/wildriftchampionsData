"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

import PageWrapper from "@/components/PageWrapper";
import {
  FiltersSkeleton,
  TableSkeleton,
} from "@/components/ui/LazySkeletons";
import styles from "./WinratesClient.module.css";
import {
  applyPreparedMovement,
  nextSortState,
  sortPreparedRows,
} from "./winrates-lib.js";

const StatsFilters = dynamic(() => import("@/components/StatsFilters"), {
  loading: () => <FiltersSkeleton />,
});
const WinratesTable = dynamic(() => import("./WinratesTable"), {
  loading: () => <TableSkeleton />,
});

type RankKey = "diamondPlus" | "masterPlus" | "king" | "peak";
type LaneKey = "top" | "jungle" | "mid" | "adc" | "support";

type SortState =
  | {
      column: "winRate" | "pickRate" | "banRate" | "strengthLevel";
      dir: "asc" | "desc";
    }
  | { column: null; dir: null };

type Row = {
  slug: string;
  name: string;
  icon: string | null;
  winRate: number | null;
  pickRate: number | null;
  banRate: number | null;
  strengthLevel: number | null;
  tierLabel: string;
  tierColor: string;
  positionDelta: number | null;
  positionTrend: Array<number | null>;
};

function WinratesContent({
  rows,
  sort,
  onSort,
  formattedUpdatedAt,
  rankKey,
  onRankChange,
  laneKey,
  onLaneChange,
}: {
  rows: Row[];
  sort: SortState;
  onSort: (column: "winRate" | "pickRate" | "banRate" | "strengthLevel") => void;
  formattedUpdatedAt: string | null;
  rankKey: RankKey;
  onRankChange: (key: string) => void;
  laneKey: LaneKey;
  onLaneChange: (key: string) => void;
}) {
  return (
    <div className={styles.shell}>
      <section className={styles.filtersPanel}>
        <div className={styles.filterSection}>
          <StatsFilters
            rankValue={rankKey}
            onRankChange={onRankChange}
            laneValue={laneKey}
            onLaneChange={onLaneChange}
            compact
          />
        </div>
      </section>

      <section className={styles.tableFrame}>
        <div className={styles.tableTop}>
          <div>
            <strong className={styles.tableTitle}>Сводная таблица</strong>
            {formattedUpdatedAt ? (
              <p className={styles.tableMeta}>Дата прогона: {formattedUpdatedAt}</p>
            ) : null}
          </div>
        </div>

        <WinratesTable rows={rows} sort={sort} onSort={onSort} />
      </section>
    </div>
  );
}

export default function WinratesClient({
  rowsBySlice,
  sliceHistoryByKey,
  maxRowCount,
  error,
  updatedAt,
  embedded = false,
}: {
  rowsBySlice: Record<string, Row[]>;
  sliceHistoryByKey: Record<string, Array<{ date: string; rows: Row[] }>>;
  maxRowCount: number;
  error: string | null;
  updatedAt: string | null;
  embedded?: boolean;
}) {
  const [rankKey, setRankKey] = useState<RankKey>("diamondPlus");
  const [laneKey, setLaneKey] = useState<LaneKey>("top");
  const [sort, setSort] = useState<SortState>({
    column: "winRate",
    dir: "desc",
  });

  void maxRowCount;

  const sliceKey = `${rankKey}|${laneKey}`;
  const rows = useMemo(() => {
    const sortedRows = sortPreparedRows(rowsBySlice[sliceKey] || [], sort) as Row[];
    return applyPreparedMovement(
      sortedRows,
      sliceHistoryByKey[sliceKey] || [],
      sort,
    ) as Row[];
  }, [rowsBySlice, sliceHistoryByKey, sliceKey, sort]);

  const formattedUpdatedAt = useMemo(() => {
    if (!updatedAt) return null;

    const date = new Date(updatedAt);
    if (Number.isNaN(date.getTime())) return null;

    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Moscow",
    }).format(date);
  }, [updatedAt]);

  const onRankChange = (key: string) => setRankKey(key as RankKey);
  const onLaneChange = (key: string) => setLaneKey(key as LaneKey);
  const onSort = (
    column: "winRate" | "pickRate" | "banRate" | "strengthLevel",
  ) => {
    setSort((prev) => nextSortState(prev, column) as SortState);
  };

  if (error) {
    return <div className={styles.errorBox}>{error}</div>;
  }

  const content = (
    <WinratesContent
      rows={rows}
      sort={sort}
      onSort={onSort}
      formattedUpdatedAt={formattedUpdatedAt}
      rankKey={rankKey}
      onRankChange={onRankChange}
      laneKey={laneKey}
      onLaneChange={onLaneChange}
    />
  );

  if (embedded) {
    return content;
  }

  return (
    <PageWrapper
      title="Винрейты, пики и баны чемпионов Wild Rift"
      paragraphs={[
        "Смотри актуальную силу чемпионов по линиям и рангам: винрейт, пикрейт, банрейт и итоговый тир на одном экране.",
      ]}
    >
      {content}
    </PageWrapper>
  );
}
