"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import PageWrapper from "@/components/PageWrapper";
import RankFilter from "@/components/RankFilter";
import LaneFilter from "@/components/LaneFilter";

import {
  WrWrap,
  WrHeader,
  WrRow,
  WrHeroCell,
  WrHeroName,
  WrRight,
  WrSortable,
  WrIndex,
  WrAvatar,
} from "@/components/styled/winrateScreen";
import WinratesTable from "./WinratesTable";

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

function ChampAvatar({
  name,
  src,
  isLcp,
}: {
  name: string;
  src?: string | null;
  isLcp: boolean;
}) {
  return (
    <WrAvatar>
      {src ? (
        <Image
          src={src}
          alt={name}
          width={32}
          height={32}
          sizes="32px"
          quality={60}
          priority={isLcp}
          fetchPriority={isLcp ? "high" : "auto"}
          loading={isLcp ? "eager" : "lazy"}
          decoding="async"
          style={{ display: "block" }}
        />
      ) : null}
    </WrAvatar>
  );
}

function winRateColor(v: number | null) {
  if (v == null) return "inherit";
  if (v > 50) return "#4ade80";
  if (v < 50) return "#f97373";
  return "inherit";
}

function pickRateColor(v: number | null) {
  if (v == null) return "inherit";
  if (v < 3) return "#f97373";
  return "#4ade80";
}

function banRateColor(v: number | null) {
  if (v == null) return "inherit";
  if (v > 10) return "#f97373";
  return "#4ade80";
}

function strengthToTier(level: number | null) {
  if (level == null) return { label: "—", color: "#9ca3af" };

  switch (level) {
    case 0:
      return { label: "S+", color: "#f97316" };
    case 1:
      return { label: "S", color: "#f97316" };
    case 2:
      return { label: "A", color: "#22c55e" };
    case 3:
      return { label: "B", color: "#eab308" };
    case 4:
      return { label: "C", color: "#9ca3af" };
    case 5:
    default:
      return { label: "D", color: "#6b7280" };
  }
}

export default function WinratesClient({
  language,
  champions,
  latestStats,
  error,
}: {
  language: string;
  champions: Champion[];
  latestStats: Record<string, HistoryItem> | null;
  error: string | null;
}) {
  const [rankKey, setRankKey] = useState<RankKey>("diamondPlus");
  const [laneKey, setLaneKey] = useState<LaneKey>("top");

  const [sort, setSort] = useState<SortState>({
    column: "winRate",
    dir: "desc",
  });

  const onRankChange = (key: string) => setRankKey(key as RankKey);
  const onLaneChange = (key: string) => setLaneKey(key as LaneKey);

  function onSort(
    column: "winRate" | "pickRate" | "banRate" | "strengthLevel"
  ) {
    setSort((prev) => {
      if (prev.column !== column) return { column, dir: "desc" };
      if (prev.dir === "desc") return { column, dir: "asc" };
      return { column: null, dir: null };
    });
  }

  const rows = useMemo(() => {
    if (!champions.length || !latestStats) return [];

    const out = champions
      .map((champ) => {
        const slug = champ.slug;
        if (!slug) return null;

        const key = `${slug}|${rankKey}|${laneKey}`;
        const stat = latestStats[key];
        if (!stat) return null;

        const displayName =
          typeof champ.name === "string" && champ.name.trim()
            ? champ.name
            : slug;

        const strengthLevel =
          stat.strengthLevel !== undefined ? stat.strengthLevel : null;

        const tier = strengthToTier(strengthLevel);

        return {
          slug,
          name: displayName,
          icon: champ.icon || null,

          winRate: stat.winRate ?? null,
          pickRate: stat.pickRate ?? null,
          banRate: stat.banRate ?? null,

          strengthLevel,
          tierLabel: tier.label,
          tierColor: tier.color,
        };
      })
      .filter(Boolean) as Array<{
      slug: string;
      name: string;
      icon: string | null;
      winRate: number | null;
      pickRate: number | null;
      banRate: number | null;
      strengthLevel: number | null;
      tierLabel: string;
      tierColor: string;
    }>;

    return out.sort((a, b) => {
      if (!sort.column || !sort.dir) return (b.winRate || 0) - (a.winRate || 0);

      const col = sort.column;

      if (col === "strengthLevel") {
        const av = a.strengthLevel ?? 999;
        const bv = b.strengthLevel ?? 999;
        if (sort.dir === "desc") return av - bv; // меньше = сильнее
        return bv - av;
      }

      const av = (a[col] ?? 0) as number;
      const bv = (b[col] ?? 0) as number;

      if (sort.dir === "desc") return bv - av;
      return av - bv;
    });
  }, [champions, latestStats, rankKey, laneKey, sort]);

  return (
    <PageWrapper
      showBack
      title="Винрейты, пикрейты, банрейты чемпионов Wild Rift по ролям и рангам"
      paragraphs={[
        "На этой странице собрана статистика винрейтов чемпионов Wild Rift по ролям и рангам.",
      ]}
    >
      {error ? <div style={{ padding: 12, opacity: 0.9 }}>{error}</div> : null}

      {!error ? (
        <WrWrap>
          <RankFilter value={rankKey} onChange={onRankChange} />
          <LaneFilter value={laneKey} onChange={onLaneChange} />

          <WinratesTable rows={rows} sort={sort} onSort={onSort} />
        </WrWrap>
      ) : null}
    </PageWrapper>
  );
}
