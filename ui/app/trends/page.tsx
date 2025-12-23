"use client";

import { useEffect, useMemo, useState } from "react";

import PageWrapper from "@/components/PageWrapper";
import TrendChartBlock from "@/components/TrendCharts";

import RankFilter from "@/components/RankFilter";
import LaneFilter from "@/components/LaneFilter";

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

/* ---------- utils ---------- */

function toNum(v: any, fallback = 0) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function buildLinearTrend(points: any[], yKey: string, xKey = "ts") {
  const n = points.length;
  if (!n) return [];

  const xs = points.map((p, i) =>
    typeof p?.[xKey] === "number" ? p[xKey] : i
  );
  const ys = points.map((p) => toNum(p?.[yKey], 0));

  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
    sumXY += xs[i] * ys[i];
    sumXX += xs[i] * xs[i];
  }

  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-12) {
    const avg = sumY / n;
    return points.map(() => Number(avg.toFixed(4)));
  }

  const a = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - a * sumX) / n;

  return points.map((_, i) => Number((a * xs[i] + b).toFixed(4)));
}

/* ---------- table ---------- */

function TrendTable({ days }: { days: any[] }) {
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
  const [champions, setChampions] = useState<any[]>([]);
  const [selectedChampion, setSelectedChampion] = useState<any>(null);
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
      .then((data) =>
        setChampions(
          (data || []).map((c: any) => ({
            slug: c.slug,
            displayName: c.name || c.slug,
          }))
        )
      )
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

  const days = useMemo(() => {
    const mapped = rawHistory
      .map((i) => {
        const d = new Date(i.date);
        return {
          fullDate: i.date,
          date: d.toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
          }),
          ts: d.getTime(),
          winRate: toNum(i.winRate),
          pickRate: toNum(i.pickRate),
          banRate: toNum(i.banRate),
        };
      })
      .sort((a, b) => a.ts - b.ts);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const daysCount = range === "month" ? 31 : 8;
    const cutoff =
      range === "all" ? 0 : todayStart.getTime() - (daysCount - 1) * 864e5;

    const filtered = mapped.filter((d) => d.ts >= cutoff);

    const winT = buildLinearTrend(filtered, "winRate");
    const pickT = buildLinearTrend(filtered, "pickRate");
    const banT = buildLinearTrend(filtered, "banRate");

    return filtered.map((d, i) => ({
      ...d,
      winTrend: winT[i],
      pickTrend: pickT[i],
      banTrend: banT[i],
    }));
  }, [rawHistory, range]);

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
        <>
          <RankFilter value={rankKey} onChange={setRankKey} />
          <LaneFilter value={laneKey} onChange={setLaneKey} />
          <RangeFilter value={range} onChange={setRange} />
        </>
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
