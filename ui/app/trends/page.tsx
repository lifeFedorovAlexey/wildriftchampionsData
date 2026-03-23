"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";

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
import { buildTrendDays, mapChampionOptions } from "./trends-lib";
import styles from "./page.module.css";

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

type ChampionEvent = {
  id: number;
  date: string | null;
  championSlug: string;
  type: string;
  scope: string;
  abilityName: string | null;
  skinName: string | null;
  title: string | null;
  summary: string | null;
};

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

function ChampionEventsPanel({ events }: { events: ChampionEvent[] }) {
  if (!events.length) return null;

  return (
    <div className={styles.eventsCard}>
      <div className={styles.eventsTitle}>События чемпиона</div>
      <div className={styles.eventsList}>
        {events.map((event) => (
          <div key={event.id} className={styles.eventRow}>
            <div className={styles.eventDate}>{event.date ?? "—"}</div>
            <div className={styles.eventBody}>
              <div className={styles.eventHeadline}>{event.title || "Обновление"}</div>
              {event.summary ? (
                <div className={styles.eventSummary}>{event.summary}</div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  const [champions, setChampions] = useState<ChampionOption[]>([]);
  const [selectedChampion, setSelectedChampion] = useState<ChampionOption | null>(null);
  const [search, setSearch] = useState("");

  const [rankKey, setRankKey] = useState("diamondPlus");
  const [laneKey, setLaneKey] = useState("top");
  const [range, setRange] = useState<"week" | "month" | "all">("week");

  const [rawHistory, setRawHistory] = useState<any[]>([]);
  const [championEvents, setChampionEvents] = useState<ChampionEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/champions?lang=ru_ru`)
      .then((response) => response.json())
      .then((data) => setChampions(mapChampionOptions(data || [])))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedChampion) return;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      slug: selectedChampion.slug,
      rank: rankKey,
      lane: laneKey,
    });

    fetch(`${API_BASE}/api/champion-history?${params}`)
      .then((response) => response.json())
      .then((payload) => setRawHistory(payload.items || []))
      .catch(() => setError("Не удалось загрузить историю"))
      .finally(() => setLoading(false));
  }, [selectedChampion, rankKey, laneKey]);

  const days = useMemo(() => buildTrendDays(rawHistory, range), [rawHistory, range]);
  const dateWindow = useMemo(() => {
    if (!days.length) return null;

    return {
      from: days[0]?.fullDate ?? null,
      to: days[days.length - 1]?.fullDate ?? null,
    };
  }, [days]);

  useEffect(() => {
    if (!selectedChampion || !dateWindow?.from || !dateWindow?.to) {
      setChampionEvents([]);
      return;
    }

    setEventsLoading(true);

    const params = new URLSearchParams({
      slug: selectedChampion.slug,
      from: dateWindow.from,
      to: dateWindow.to,
      limit: "100",
    });

    fetch(`${API_BASE}/api/champion-events?${params}`)
      .then((response) => response.json())
      .then((payload) => setChampionEvents(payload.items || []))
      .catch(() => setChampionEvents([]))
      .finally(() => setEventsLoading(false));
  }, [selectedChampion, dateWindow]);

  const enrichedDays = useMemo(() => {
    const eventsByDate = new Map<string, ChampionEvent[]>();

    for (const event of championEvents) {
      if (!event?.date) continue;
      const bucket = eventsByDate.get(event.date) || [];
      bucket.push(event);
      eventsByDate.set(event.date, bucket);
    }

    return days.map((day: TrendDay) => {
      const events = eventsByDate.get(day.fullDate) || [];
      return {
        ...day,
        events,
        eventCount: events.length,
      };
    });
  }, [days, championEvents]);

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
          onSelect={setSelectedChampion}
        />

        {!loading ? (
          <StatsFilters
            rankValue={rankKey}
            onRankChange={setRankKey}
            laneValue={laneKey}
            onLaneChange={setLaneKey}
            extraControls={<RangeFilter value={range} onChange={setRange} />}
          />
        ) : null}

        {!selectedChampion ? <TextHint>Выбери чемпиона.</TextHint> : null}
      </div>

      {loading ? <LoadingRing label="Считаю тренды..." /> : null}

      {!loading && selectedChampion && enrichedDays.length > 0 ? (
        <div className={styles.stackCompact}>
          <TrendChartBlock days={enrichedDays} />
          <ChampionEventsPanel events={championEvents} />
          <TrendTable days={enrichedDays} />
        </div>
      ) : null}

      {!loading && selectedChampion && !enrichedDays.length ? (
        <TextHint>Нет статистики в рамках линии, чемпиона или ранга.</TextHint>
      ) : null}

      {!loading && !eventsLoading && selectedChampion && enrichedDays.length > 0 && !championEvents.length ? (
        <TextHint>В выбранном диапазоне для этого чемпиона пока не найдено событий обновлений.</TextHint>
      ) : null}

      {error ? <TextHint>{error}</TextHint> : null}
    </PageWrapper>
  );
}
