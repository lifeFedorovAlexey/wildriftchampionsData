"use client";

import { useEffect, useMemo, useState } from "react";

import PageWrapper from "@/components/PageWrapper";
import RankFilter from "@/components/RankFilter";
import LaneFilter from "@/components/LaneFilter";
import LoadingRing from "@/components/LoadingRing";

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
  WrAvatarImg,
} from "@/components/styled/winrateScreen";

// ВАЖНО: для локалки используем прокси из next.config.ts (см. ниже)
const API = "/wr-api";

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

function ChampAvatar({ name, src }: { name: string; src?: string | null }) {
  return (
    <WrAvatar>
      {src ? (
        <WrAvatarImg
          src={src}
          alt={name}
          decoding="async"
          width="64"
          height="64"
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

export default function Page() {
  const language = "ru_ru";

  const [champions, setChampions] = useState<Champion[]>([]);
  const [latestStats, setLatestStats] = useState<Record<
    string,
    HistoryItem
  > | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rankKey, setRankKey] = useState<RankKey>("diamondPlus");
  const [laneKey, setLaneKey] = useState<LaneKey>("top");

  const [sort, setSort] = useState<SortState>({
    column: "winRate",
    dir: "desc",
  });

  // фикс TS: RankFilter/LaneFilter ждут (key: string) => void
  const onRankChange = (key: string) => setRankKey(key as RankKey);
  const onLaneChange = (key: string) => setLaneKey(key as LaneKey);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const [champRes, histRes] = await Promise.all([
          fetch(`${API}/api/champions?lang=${encodeURIComponent(language)}`, {
            cache: "no-store",
          }),
          fetch(`${API}/api/champion-history`, { cache: "no-store" }),
        ]);

        if (!champRes.ok) throw new Error(`Champions HTTP ${champRes.status}`);
        if (!histRes.ok) throw new Error(`History HTTP ${histRes.status}`);

        const champsJson = (await champRes.json()) as Champion[];
        const histJson = (await histRes.json()) as { items?: HistoryItem[] };

        if (cancelled) return;

        setChampions(Array.isArray(champsJson) ? champsJson : []);

        const items = Array.isArray(histJson.items) ? histJson.items : [];
        const latestMap: Record<string, HistoryItem> = {};

        for (const item of items) {
          if (!item?.slug || !item?.rank || !item?.lane || !item?.date)
            continue;

          const key = `${item.slug}|${item.rank}|${item.lane}`;
          const prev = latestMap[key];

          if (!prev) latestMap[key] = item;
          else if (String(item.date) > String(prev.date)) latestMap[key] = item;
        }

        setLatestStats(latestMap);
      } catch (e) {
        console.error("Winrates load error:", e);
        if (!cancelled) setError("Не удалось загрузить статистику винрейтов.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [language]);

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
      // дефолт — winRate desc
      if (!sort.column || !sort.dir) return (b.winRate || 0) - (a.winRate || 0);

      const col = sort.column;

      if (col === "strengthLevel") {
        const av = a.strengthLevel ?? 999;
        const bv = b.strengthLevel ?? 999;
        // МЕНЬШЕ = СИЛЬНЕЕ (0 = S+)
        if (sort.dir === "desc") return av - bv;
        return bv - av;
      }

      const av = (a[col] ?? 0) as number;
      const bv = (b[col] ?? 0) as number;

      if (sort.dir === "desc") return bv - av;
      return av - bv;
    });
  }, [champions, latestStats, rankKey, laneKey, sort]);

  if (loading) return <LoadingRing label="Загружаю статистику…" />;

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

          <WrHeader>
            <div>#</div>
            <div>Герой</div>

            <WrSortable onClick={() => onSort("strengthLevel")}>
              Тир{" "}
              {sort.column === "strengthLevel"
                ? sort.dir === "asc"
                  ? "▲"
                  : "▼"
                : ""}
            </WrSortable>

            <WrSortable onClick={() => onSort("winRate")}>
              Победы{" "}
              {sort.column === "winRate"
                ? sort.dir === "asc"
                  ? "▲"
                  : "▼"
                : ""}
            </WrSortable>

            <WrSortable onClick={() => onSort("pickRate")}>
              Пики{" "}
              {sort.column === "pickRate"
                ? sort.dir === "asc"
                  ? "▲"
                  : "▼"
                : ""}
            </WrSortable>

            <WrSortable onClick={() => onSort("banRate")}>
              Баны{" "}
              {sort.column === "banRate"
                ? sort.dir === "asc"
                  ? "▲"
                  : "▼"
                : ""}
            </WrSortable>
          </WrHeader>

          {rows.map((row, idx) => (
            <WrRow key={row.slug}>
              <WrIndex>{idx + 1}</WrIndex>

              <WrHeroCell>
                <ChampAvatar name={row.name} src={row.icon} />
                <WrHeroName>{row.name}</WrHeroName>
              </WrHeroCell>

              <WrRight style={{ fontWeight: 700, color: row.tierColor }}>
                {row.tierLabel}
              </WrRight>

              <WrRight style={{ color: winRateColor(row.winRate) }}>
                {row.winRate != null ? `${row.winRate.toFixed(2)}%` : "—"}
              </WrRight>

              <WrRight style={{ color: pickRateColor(row.pickRate) }}>
                {row.pickRate != null ? `${row.pickRate.toFixed(2)}%` : "—"}
              </WrRight>

              <WrRight style={{ color: banRateColor(row.banRate) }}>
                {row.banRate != null ? `${row.banRate.toFixed(2)}%` : "—"}
              </WrRight>
            </WrRow>
          ))}

          {!rows.length ? (
            <div style={{ padding: 12, opacity: 0.8, textAlign: "center" }}>
              Нет данных для выбранных фильтров.
            </div>
          ) : null}
        </WrWrap>
      ) : null}
    </PageWrapper>
  );
}
