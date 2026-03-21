"use client";

import { useEffect, useMemo, useState } from "react";

import PageWrapper from "@/components/PageWrapper";
import TrendChartBlock from "@/components/TrendCharts";

import StatsFilters from "@/components/StatsFilters";

import ChampionSearch from "@/components/ChampionSearch";

import { API_BASE } from "@/constants/apiBase";
import {
  TrTableWrap,
  TrTableHead,
  TrRight,
  TrTableRow,
  TrDateCell,
  TrDateSub,
  TrMetricCell,
  TrMetricMain,
  TrMetricDelta,
} from "@/components/styled/trendScreen";
import LoadingRing from "@/components/LoadingRing";
import RangeFilter from "@/components/RangeFilter";
import TextHint from "@/components/TextHint";
import { buildTrendDays, mapChampionOptions } from "./trends-lib";

/* ---------- table ---------- */

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

function TrendTable({ days }: { days: TrendDay[] }) {
  if (!days.length) return null;

  const getDelta = (cur: number, prev?: number) => {
    if (prev == null) return null;
    const diff = Number((cur - prev).toFixed(2));
    if (Math.abs(diff) < 0.01)
      return { sign: "→", text: "0.00", color: "#9ca3af" };
    if (diff > 0)
      return { sign: "↑", text: `+${diff.toFixed(2)}`, color: "#4ade80" };
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

      {view.map((d, i) => {
        const prev = view[i + 1];
        const winD = prev && getDelta(d.winRate, prev.winRate);
        const pickD = prev && getDelta(d.pickRate, prev.pickRate);
        const banD = prev && getDelta(d.banRate, prev.banRate);

        return (
          <TrTableRow key={d.fullDate}>
            <TrDateCell>
              <span>{d.date}</span>
              <TrDateSub>{d.fullDate}</TrDateSub>
            </TrDateCell>

            <TrMetricCell>
              <TrMetricMain>{d.winRate.toFixed(2)}%</TrMetricMain>
              <TrMetricDelta style={{ color: winD?.color }}>
                {winD ? `${winD.sign} ${winD.text}` : "—"}
              </TrMetricDelta>
            </TrMetricCell>

            <TrMetricCell>
              <TrMetricMain style={{ color: "#93c5fd" }}>
                {d.pickRate.toFixed(2)}%
              </TrMetricMain>
              <TrMetricDelta style={{ color: pickD?.color }}>
                {pickD ? `${pickD.sign} ${pickD.text}` : "—"}
              </TrMetricDelta>
            </TrMetricCell>

            <TrMetricCell>
              <TrMetricMain style={{ color: "#fed7aa" }}>
                {d.banRate.toFixed(2)}%
              </TrMetricMain>
              <TrMetricDelta style={{ color: banD?.color }}>
                {banD ? `${banD.sign} ${banD.text}` : "—"}
              </TrMetricDelta>
            </TrMetricCell>
          </TrTableRow>
        );
      })}
    </TrTableWrap>
  );
}

/* ---------- PAGE ---------- */

export default function Page() {
  const [champions, setChampions] = useState<ChampionOption[]>([]);
  const [selectedChampion, setSelectedChampion] = useState<ChampionOption | null>(null);
  const [search, setSearch] = useState("");

  const [rankKey, setRankKey] = useState("diamondPlus");
  const [laneKey, setLaneKey] = useState("top");
  const [range, setRange] = useState<"week" | "month" | "all">("week");

  const [rawHistory, setRawHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* champions */
  useEffect(() => {
    fetch(`${API_BASE}/api/champions?lang=ru_ru`)
      .then((r) => r.json())
      .then((data) => setChampions(mapChampionOptions(data || [])))
      .catch(() => {});
  }, []);

  /* history */
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
      .then((r) => r.json())
      .then((j) => setRawHistory(j.items || []))
      .catch(() => setError("Не удалось загрузить историю"))
      .finally(() => setLoading(false));
  }, [selectedChampion, rankKey, laneKey]);

  const days = useMemo(() => buildTrendDays(rawHistory, range), [rawHistory, range]);

  return (
    <PageWrapper
      showBack
      title="Тренды Wild Rift"
      paragraphs={[
        "Раздел трендов показывает изменения популярности и эффективности чемпионов со временем.",
        "Он помогает отслеживать влияние патчей и изменения игровой меты.",
      ]}
    >
      <ChampionSearch
        champions={champions}
        value={search}
        onChange={setSearch}
        onSelect={setSelectedChampion}
      />

      {!loading && (
        <StatsFilters
          rankValue={rankKey}
          onRankChange={setRankKey}
          laneValue={laneKey}
          onLaneChange={setLaneKey}
          extraControls={<RangeFilter value={range} onChange={setRange} />}
        />
      )}

      {!selectedChampion && <TextHint>Выбери чемпиона.</TextHint>}

      {loading && <LoadingRing label="Считаю тренды…" />}

      {!loading && selectedChampion && days.length > 0 ? (
        <>
          <TrendChartBlock days={days} />
          <TrendTable days={days} />
        </>
      ) : (
        !loading &&
        selectedChampion && (
          <TextHint>Нет статистики в рамках линии/чемпиона/ранга</TextHint>
        )
      )}
    </PageWrapper>
  );
}
