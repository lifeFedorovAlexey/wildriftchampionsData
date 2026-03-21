"use client";

import { useMemo, useState } from "react";

import PageWrapper from "@/components/PageWrapper";
import StatsFilters from "@/components/StatsFilters";
import styles from "./WinratesClient.module.css";
import WinratesTable from "./WinratesTable";
import { buildWinrateRows, nextSortState } from "./winrates-lib.js";

type RankKey = "diamondPlus" | "masterPlus" | "king" | "peak";
type LaneKey = "top" | "jungle" | "mid" | "adc" | "support";

type Champion = {
  slug: string;
  name?: string | null;
  icon?: string | null;
};

type HistoryItem = {
  date: string;
  slug: string;
  rank: string;
  lane: string;
  winRate?: number | null;
  pickRate?: number | null;
  banRate?: number | null;
  strengthLevel?: number | null;
};

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
};

export default function WinratesClient({
  champions,
  latestStats,
  historyItems,
  error,
  updatedAt,
}: {
  champions: Champion[];
  latestStats: Record<string, HistoryItem> | null;
  historyItems: HistoryItem[];
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
    () =>
      buildWinrateRows({
        champions,
        latestStats,
        historyItems,
        rankKey,
        laneKey,
        sort,
      }) as Row[],
    [champions, historyItems, laneKey, latestStats, rankKey, sort],
  );

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

          <section className={styles.tableFrame}>
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
