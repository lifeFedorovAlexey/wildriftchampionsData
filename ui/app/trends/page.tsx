"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import PageWrapper from "@/components/PageWrapper";
import LoadingRing from "@/components/LoadingRing";
import TextHint from "@/components/TextHint";
import {
  ChartSkeleton,
  FiltersSkeleton,
  PillsSkeleton,
  SearchSkeleton,
} from "@/components/ui/LazySkeletons";
import { API_BASE } from "@/constants/apiBase";
import {
  TrDateCell,
  TrDateSub,
  TrMetricCell,
  TrMetricDelta,
  TrMetricMain,
  TrRight,
  TrTableHead,
  TrTableRow,
  TrTableWrap,
} from "@/components/styled/trendScreen";
import {
  buildTrendDays,
  getAvailableLaneKeys,
  getAvailableRankKeys,
  mapChampionOptions,
  resolveAvailableTrendFilters,
} from "./trends-lib";
import { LANE_OPTIONS, RANK_OPTIONS } from "@/components/screensConstants";
import styles from "./page.module.css";
import type { TrendEvents } from "@/components/TrendCharts/trend-events-types";

const TrendChartBlock = dynamic(() => import("@/components/TrendCharts"), {
  loading: () => <ChartSkeleton />,
});
const StatsFilters = dynamic(() => import("@/components/StatsFilters"), {
  loading: () => <FiltersSkeleton />,
});
const ChampionSearch = dynamic(() => import("@/components/ChampionSearch"), {
  loading: () => <SearchSkeleton />,
});
const RangeFilter = dynamic(() => import("@/components/RangeFilter"), {
  loading: () => <PillsSkeleton />,
});

type TrendDay = {
  fullDate: string;
  date: string;
  ts: number;
  winRate: number;
  pickRate: number;
  banRate: number;
  winTrend: number;
  pickTrend: number;
  banTrend: number;
};

type ChampionOption = {
  slug: string;
  displayName: string;
};

type RawHistoryItem = {
  date: string;
  winRate?: number | null;
  pickRate?: number | null;
  banRate?: number | null;
};

type FilterAvailability = { rank: string; lane: string };

function TrendTable({ days }: { days: TrendDay[] }) {
  if (!days.length) return null;

  const getDelta = (cur: number, prev?: number) => {
    if (prev == null) return null;
    const diff = Number((cur - prev).toFixed(2));
    if (Math.abs(diff) < 0.01) {
      return { sign: "→", text: "0.00", color: "#9ca3af" };
    }
    if (diff > 0) {
      return { sign: "↑", text: `+${diff.toFixed(2)}`, color: "#4ade80" };
    }
    return { sign: "↓", text: diff.toFixed(2), color: "#f97373" };
  };

  const view = [...days].reverse();

  return (
    <TrTableWrap>
      <TrTableHead>
        <div>Дата</div>
        <TrRight>Победы</TrRight>
        <TrRight>Пики</TrRight>
        <TrRight>Баны</TrRight>
      </TrTableHead>

      {view.map((day, index) => {
        const prev = view[index + 1];
        const winDelta = prev && getDelta(day.winRate, prev.winRate);
        const pickDelta = prev && getDelta(day.pickRate, prev.pickRate);
        const banDelta = prev && getDelta(day.banRate, prev.banRate);

        return (
          <TrTableRow key={day.fullDate}>
            <TrDateCell>
              <span>{day.date}</span>
              <TrDateSub>{day.fullDate}</TrDateSub>
            </TrDateCell>

            <TrMetricCell>
              <TrMetricMain>{day.winRate.toFixed(2)}%</TrMetricMain>
              <TrMetricDelta style={{ color: winDelta?.color }}>
                {winDelta ? `${winDelta.sign} ${winDelta.text}` : "—"}
              </TrMetricDelta>
            </TrMetricCell>

            <TrMetricCell>
              <TrMetricMain style={{ color: "#93c5fd" }}>
                {day.pickRate.toFixed(2)}%
              </TrMetricMain>
              <TrMetricDelta style={{ color: pickDelta?.color }}>
                {pickDelta ? `${pickDelta.sign} ${pickDelta.text}` : "—"}
              </TrMetricDelta>
            </TrMetricCell>

            <TrMetricCell>
              <TrMetricMain style={{ color: "#fed7aa" }}>
                {day.banRate.toFixed(2)}%
              </TrMetricMain>
              <TrMetricDelta style={{ color: banDelta?.color }}>
                {banDelta ? `${banDelta.sign} ${banDelta.text}` : "—"}
              </TrMetricDelta>
            </TrMetricCell>
          </TrTableRow>
        );
      })}
    </TrTableWrap>
  );
}

export default function Page() {
  const [champions, setChampions] = useState<ChampionOption[]>([]);
  const [selectedChampion, setSelectedChampion] = useState<ChampionOption | null>(null);
  const [search, setSearch] = useState("");

  const [rankKey, setRankKey] = useState("diamondPlus");
  const [laneKey, setLaneKey] = useState("top");
  const [range, setRange] = useState<"week" | "month" | "all">("week");

  const [rawHistory, setRawHistory] = useState<RawHistoryItem[]>([]);
  const [filterAvailability, setFilterAvailability] = useState<FilterAvailability[]>([]);
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);
  const availabilityChampionRef = useRef<string | null>(null);
  const [trendEvents, setTrendEvents] = useState<TrendEvents>({ patches: [], seasons: [] });
  const [eventsError, setEventsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetHistoryState = () => {
    setLoading(true);
    setError(null);
    setRawHistory([]);
    setTrendEvents({ patches: [], seasons: [] });
    setEventsError(false);
  };

  const handleChampionSelect = (champion: ChampionOption | null) => {
    if (champion?.slug === selectedChampion?.slug) return;
    setSelectedChampion(champion);
    setFilterAvailability([]);
    setAvailabilityLoaded(false);
    availabilityChampionRef.current = null;

    if (!champion) {
      setLoading(false);
      setError(null);
      setRawHistory([]);
      setTrendEvents({ patches: [], seasons: [] });
      setEventsError(false);
      return;
    }

    resetHistoryState();
  };

  const handleRankChange = (key: string) => {
    if (key === rankKey) return;
    if (availabilityLoaded && !getAvailableRankKeys(filterAvailability, laneKey).includes(key)) {
      return;
    }
    setRankKey(key);
    if (selectedChampion) {
      resetHistoryState();
    }
  };

  const handleLaneChange = (key: string) => {
    if (key === laneKey) return;
    if (availabilityLoaded && !getAvailableLaneKeys(filterAvailability, rankKey).includes(key)) {
      return;
    }
    setLaneKey(key);
    if (selectedChampion) {
      resetHistoryState();
    }
  };

  const handleRangeChange = (value: "week" | "month" | "all") => {
    if (value === range) return;
    setRange(value);
    setTrendEvents({ patches: [], seasons: [] });
    setEventsError(false);
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/champions?lang=ru_ru`)
      .then((response) => response.json())
      .then((data) => setChampions(mapChampionOptions(data || [])))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedChampion) return;

    const controller = new AbortController();

    const params = new URLSearchParams({
      slug: selectedChampion.slug,
      rank: rankKey,
      lane: laneKey,
    });
    if (availabilityChampionRef.current !== selectedChampion.slug) {
      params.set("availability", "1");
    }

    fetch(`${API_BASE}/api/champion-history?${params}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((payload) => {
        if (controller.signal.aborted) return;
        if (Array.isArray(payload.availability)) {
          const nextAvailability = payload.availability as FilterAvailability[];
          availabilityChampionRef.current = selectedChampion.slug;
          setFilterAvailability(nextAvailability);
          setAvailabilityLoaded(true);
          const nextFilters = resolveAvailableTrendFilters(nextAvailability, {
            rank: rankKey,
            lane: laneKey,
          });
          if (nextFilters.rank !== rankKey || nextFilters.lane !== laneKey) {
            setRankKey(nextFilters.rank);
            setLaneKey(nextFilters.lane);
            resetHistoryState();
            return;
          }
        }
        const items = Array.isArray(payload.items) ? payload.items : [];
        setRawHistory(items);
      })
      .catch((fetchError) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError("Не удалось загрузить историю");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    return () => controller.abort();
  }, [selectedChampion, rankKey, laneKey]);

  const disabledRankKeys = useMemo(() => {
    if (!selectedChampion || !availabilityLoaded) return [];
    const available = new Set(getAvailableRankKeys(filterAvailability, laneKey));
    return RANK_OPTIONS.map((option) => option.key).filter((key) => !available.has(key));
  }, [availabilityLoaded, filterAvailability, laneKey, selectedChampion]);

  const disabledLaneKeys = useMemo(() => {
    if (!selectedChampion || !availabilityLoaded) return [];
    const available = new Set(getAvailableLaneKeys(filterAvailability, rankKey));
    return LANE_OPTIONS.map((option) => option.key).filter((key) => !available.has(key));
  }, [availabilityLoaded, filterAvailability, rankKey, selectedChampion]);

  const days = useMemo(() => buildTrendDays(rawHistory, range), [rawHistory, range]);
  const dateWindow = useMemo(() => {
    if (!days.length) return null;

    return {
      from: days[0]?.fullDate ?? null,
      to: days[days.length - 1]?.fullDate ?? null,
    };
  }, [days]);

  useEffect(() => {
    if (!selectedChampion || !dateWindow?.from || !dateWindow?.to) return;

    const controller = new AbortController();
    const params = new URLSearchParams({
      slug: selectedChampion.slug,
      lane: laneKey,
      from: dateWindow.from,
      to: dateWindow.to,
    });

    fetch(`${API_BASE}/api/trend-events?${params}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Event request failed");
        return response.json();
      })
      .then((payload) => {
        if (controller.signal.aborted) return;
        setTrendEvents({
          patches: Array.isArray(payload.patches) ? payload.patches : [],
          seasons: Array.isArray(payload.seasons) ? payload.seasons : [],
        });
        setEventsError(false);
      })
      .catch(() => {
        if (!controller.signal.aborted) setEventsError(true);
      });
    return () => controller.abort();
  }, [selectedChampion, laneKey, dateWindow]);

  return (
    <PageWrapper
      title="Тренды Wild Rift"
      paragraphs={[
        "Раздел трендов показывает изменения популярности и эффективности чемпионов со временем.",
        "Он помогает отслеживать влияние патчей и изменения игровой меты.",
      ]}
    >
      <div className={styles.stack}>
        <ChampionSearch
          champions={champions}
          value={search}
          onChange={setSearch}
          onSelect={handleChampionSelect}
        />

        {!loading ? (
          <StatsFilters
            rankValue={rankKey}
            onRankChange={handleRankChange}
            laneValue={laneKey}
            onLaneChange={handleLaneChange}
            disabledRankKeys={disabledRankKeys}
            disabledLaneKeys={disabledLaneKeys}
            extraControls={<RangeFilter value={range} onChange={handleRangeChange} />}
          />
        ) : null}

        {!selectedChampion ? <TextHint>Выбери чемпиона.</TextHint> : null}
      </div>

      {loading ? <LoadingRing label="Считаю тренды..." /> : null}

      {!loading && selectedChampion && days.length > 0 ? (
        <div className={styles.stackCompact}>
          <TrendChartBlock key={`${selectedChampion.slug}:${laneKey}:${rankKey}:${range}`} days={days} patches={trendEvents.patches} seasons={trendEvents.seasons} />
          <TrendTable days={days} />
        </div>
      ) : null}

      {!loading && selectedChampion && !days.length ? (
        <TextHint>Нет статистики в рамках линии, чемпиона или ранга.</TextHint>
      ) : null}

      {!loading && selectedChampion && days.length > 0 && eventsError ? (
        <TextHint>Не удалось загрузить отметки патчей. Статистика доступна.</TextHint>
      ) : null}

      {error ? <TextHint>{error}</TextHint> : null}
    </PageWrapper>
  );
}
