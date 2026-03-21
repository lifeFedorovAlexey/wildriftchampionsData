"use client";

import { useMemo, useState } from "react";

import PageWrapper from "@/components/PageWrapper";
import StatsFilters from "@/components/StatsFilters";
import styles from "./WinratesClient.module.css";
import WinratesTable from "./WinratesTable";
import { nextSortState, sortPreparedRows } from "./winrates-lib.js";

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

export default function WinratesClient({
  rowsBySlice,
  maxRowCount,
  error,
  updatedAt,
}: {
  rowsBySlice: Record<string, Row[]>;
  maxRowCount: number;
  error: string | null;
  updatedAt: string | null;
}) {
  const [rankKey, setRankKey] = useState<RankKey>("diamondPlus");
  const [laneKey, setLaneKey] = useState<LaneKey>("top");
  const [sort, setSort] = useState<SortState>({
    column: "winRate",
    dir: "desc",
  });

  const rows = useMemo(
    () => sortPreparedRows(rowsBySlice[`${rankKey}|${laneKey}`] || [], sort) as Row[],
    [laneKey, rankKey, rowsBySlice, sort],
  );

  const tableMinHeight = useMemo(() => {
    const rowCount = Math.max(maxRowCount || 0, rows.length || 0, 12);
    const headerHeight = 68;
    const rowHeight = 48;
    const footerHeight = 20;

    return headerHeight + rowCount * rowHeight + footerHeight;
  }, [maxRowCount, rows.length]);

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

  return (
    <PageWrapper
      showBack
      title="Винрейты, пики и баны чемпионов Wild Rift"
      paragraphs={[
        "Смотри актуальную силу чемпионов по линиям и рангам: винрейт, пикрейт, банрейт и итоговый тир на одном экране.",
      ]}
    >
      {error ? (
        <div className={styles.errorBox}>{error}</div>
      ) : (
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

          <section
            className={styles.tableFrame}
            style={{ minHeight: `${tableMinHeight}px` }}
          >
            <div className={styles.tableTop}>
              <div>
                <strong className={styles.tableTitle}>Сводная таблица</strong>
                {formattedUpdatedAt ? (
                  <p className={styles.tableMeta}>
                    Дата прогона: {formattedUpdatedAt}
                  </p>
                ) : null}
              </div>
            </div>

            <WinratesTable rows={rows} sort={sort} onSort={onSort} />
          </section>
        </div>
      )}
    </PageWrapper>
  );
}
