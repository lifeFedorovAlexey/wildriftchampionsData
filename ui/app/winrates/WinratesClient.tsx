"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import PageWrapper from "@/components/PageWrapper";
import StatsFilters from "@/components/StatsFilters";
import styles from "./WinratesClient.module.css";
import WinratesTable from "./WinratesTable";
import type { WinrateRow, WinratesRowsBySlice } from "./types";
import VirtualAssistant, {
  analyzeChampionRecommendations,
  findNewChampionInsights,
  notifyVirtualAssistant,
} from "@/components/virtual-assistant";
import { LANE_OPTIONS, RANK_OPTIONS } from "@/components/screensConstants";
import {
  nextSortState,
  sortPreparedRows,
} from "./winrates-lib.js";

type RankKey = "diamondPlus" | "masterPlus" | "king" | "peak" | "overall";
type LaneKey = "top" | "jungle" | "mid" | "adc" | "support";

type SortState =
  | {
      column: "winRate" | "pickRate" | "banRate" | "strengthLevel";
      dir: "asc" | "desc";
    }
  | { column: null; dir: null };

function WinratesContent({
  rows,
  sort,
  onSort,
  formattedUpdatedAt,
  rankKey,
  onRankChange,
  laneKey,
  onLaneChange,
  onListEnd,
  onChampionInspect,
}: {
  rows: WinrateRow[];
  sort: SortState;
  onSort: (column: "winRate" | "pickRate" | "banRate" | "strengthLevel") => void;
  formattedUpdatedAt: string | null;
  rankKey: RankKey;
  onRankChange: (key: string) => void;
  laneKey: LaneKey;
  onLaneChange: (key: string) => void;
  onListEnd: () => void;
  onChampionInspect: (slug: string) => void;
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

        <WinratesTable
          rows={rows}
          sort={sort}
          onSort={onSort}
          onListEnd={onListEnd}
          onChampionInspect={onChampionInspect}
          listContextKey={`${rankKey}|${laneKey}`}
        />
      </section>
    </div>
  );
}

export default function WinratesClient({
  rowsBySlice,
  maxRowCount,
  error,
  updatedAt,
  embedded = false,
}: {
  rowsBySlice: WinratesRowsBySlice;
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
  const announcedListEnds = useRef(new Set<string>());
  const userInteractedWithStats = useRef(false);

  void maxRowCount;

  const sliceKey = `${rankKey}|${laneKey}`;
  const rawRows = useMemo(
    () => rowsBySlice[sliceKey] || [],
    [rowsBySlice, sliceKey],
  );
  const rows = useMemo(() => {
    return sortPreparedRows(rowsBySlice[sliceKey] || [], sort) as WinrateRow[];
  }, [rowsBySlice, sliceKey, sort]);

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

  const onRankChange = (key: string) => {
    userInteractedWithStats.current = true;
    const rank = RANK_OPTIONS.find((option) => option.key === key);
    setRankKey(key as RankKey);
    notifyVirtualAssistant({
      kind: "rank_changed",
      rankKey: key,
      rankLabel: rank?.label || key,
    });
  };
  const onLaneChange = (key: string) => {
    userInteractedWithStats.current = true;
    const lane = LANE_OPTIONS.find((option) => option.key === key);
    const nextRows = rowsBySlice[`${rankKey}|${key}`] || [];
    const insight = analyzeChampionRecommendations(nextRows);
    const newcomers = findNewChampionInsights(nextRows).slice(0, 2);
    setLaneKey(key as LaneKey);
    notifyVirtualAssistant({
      kind: "lane_changed",
      laneKey: key,
      laneLabel: lane?.label || key,
      recommended: insight.recommended,
      newcomers,
    });
  };
  const onSort = (
    column: "winRate" | "pickRate" | "banRate" | "strengthLevel",
  ) => {
    userInteractedWithStats.current = true;
    setSort((prev) => nextSortState(prev, column) as SortState);
    notifyVirtualAssistant({ kind: "metric_sorted", metric: column });
  };

  const onListEnd = useCallback(() => {
    if (announcedListEnds.current.has(sliceKey)) return;
    announcedListEnds.current.add(sliceKey);
    const lane = LANE_OPTIONS.find((option) => option.key === laneKey);
    const insight = analyzeChampionRecommendations(rawRows);
    notifyVirtualAssistant({
      kind: "list_end",
      laneLabel: lane?.label || laneKey,
      avoid: insight.avoid,
    });
  }, [laneKey, rawRows, sliceKey]);

  const onChampionInspect = useCallback((slug: string) => {
    const champion = analyzeChampionRecommendations(rawRows).rated.find(
      (candidate) => candidate.slug === slug,
    );
    if (!champion) return;
    const rank = RANK_OPTIONS.find((option) => option.key === rankKey);
    const lane = LANE_OPTIONS.find((option) => option.key === laneKey);
    notifyVirtualAssistant({
      kind: "champion_focused",
      champion,
      rankKey,
      laneKey,
      rankLabel: rank?.label || rankKey,
      laneLabel: lane?.label || laneKey,
      position: rows.findIndex((row) => row.slug === slug) + 1,
      total: rows.length,
    });
  }, [laneKey, rankKey, rawRows, rows]);

  useEffect(() => {
    if (error) notifyVirtualAssistant({ kind: "load_error", message: error });
  }, [error]);

  useEffect(() => {
    if (error || !rawRows.length || userInteractedWithStats.current) return;
    const timer = window.setTimeout(() => {
      if (userInteractedWithStats.current) return;
      const lane = LANE_OPTIONS.find((option) => option.key === laneKey);
      const insight = analyzeChampionRecommendations(rawRows);
      notifyVirtualAssistant({
        kind: "lane_changed",
        laneKey,
        laneLabel: lane?.label || laneKey,
        recommended: insight.recommended,
        newcomers: findNewChampionInsights(rawRows).slice(0, 2),
      });
    }, 4200);

    return () => window.clearTimeout(timer);
  }, [error, laneKey, rawRows]);

  if (error) {
    return (
      <>
        <div className={styles.errorBox}>{error}</div>
        <VirtualAssistant />
      </>
    );
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
      onListEnd={onListEnd}
      onChampionInspect={onChampionInspect}
    />
  );

  if (embedded) {
    return (
      <>
        {content}
        <VirtualAssistant />
      </>
    );
  }

  return (
    <>
      <PageWrapper
        title="Винрейты, пики и баны чемпионов Wild Rift"
        paragraphs={[
          "Смотри актуальную силу чемпионов по линиям и рангам: винрейт, пикрейт, банрейт и итоговый тир на одном экране.",
        ]}
      >
        {content}
      </PageWrapper>
      <VirtualAssistant />
    </>
  );
}
