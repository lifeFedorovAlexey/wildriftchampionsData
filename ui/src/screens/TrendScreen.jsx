// ui/src/screens/TrendScreen.jsx
import { useEffect, useMemo, useState } from "react";
import PageWrapper from "../components/PageWrapper.jsx";
import TrendChartBlock from "../components/TrendCharts";
import { ChampionSearch } from "../components/ChampionSearch.jsx";
import { RankFilter } from "../components/RankFilter.jsx";
import { LaneFilter } from "../components/LaneFilter.jsx";

import {
  TrSearchRow,
  TrRangeRow,
  TrRangeBtn,
  TrHint,
  TrTableWrap,
  TrTableHead,
  TrTableRow,
  TrRight,
  TrDateCell,
  TrDateSub,
  TrMetricCell,
  TrMetricMain,
  TrMetricDelta,
} from "../components/styled/TrendScreen.styled.js";

const API_BASE = "https://wr-api-pjtu.vercel.app";

// ---------- таблица ----------
function TrendTable({ days }) {
  if (!days || !days.length) return null;

  const getDelta = (current, prev) => {
    if (prev == null) return null;
    const diff = Number((current - prev).toFixed(2));

    if (Math.abs(diff) < 0.01) {
      return { sign: "→", text: "0.00", color: "#9ca3af" };
    }

    if (diff > 0) {
      return { sign: "↑", text: `+${diff.toFixed(2)}`, color: "#4ade80" };
    }

    return { sign: "↓", text: diff.toFixed(2), color: "#f97373" };
  };

  const viewDays = [...days].reverse();

  return (
    <TrTableWrap>
      <TrTableHead>
        <div>Дата</div>
        <TrRight>Победы</TrRight>
        <TrRight>Пики</TrRight>
        <TrRight>Баны</TrRight>
      </TrTableHead>

      {viewDays.map((day, index) => {
        const prev = index === viewDays.length - 1 ? null : viewDays[index + 1];

        const winDelta = prev ? getDelta(day.winRate, prev.winRate) : null;
        const pickDelta = prev ? getDelta(day.pickRate, prev.pickRate) : null;
        const banDelta = prev ? getDelta(day.banRate, prev.banRate) : null;

        return (
          <TrTableRow
            key={day.fullDate}
            style={{
              borderBottom:
                index === viewDays.length - 1
                  ? "none"
                  : "1px solid rgba(15,23,42,1)",
            }}
          >
            <TrDateCell>
              <span>{day.date}</span>
              <TrDateSub>{day.fullDate}</TrDateSub>
            </TrDateCell>

            <TrMetricCell>
              <TrMetricMain>{day.winRate.toFixed(2)}%</TrMetricMain>
              <TrMetricDelta style={{ color: winDelta?.color ?? "#9ca3af" }}>
                {winDelta ? `${winDelta.sign} ${winDelta.text}` : "—"}
              </TrMetricDelta>
            </TrMetricCell>

            <TrMetricCell>
              <TrMetricMain style={{ color: "#93c5fd" }}>
                {day.pickRate.toFixed(2)}%
              </TrMetricMain>
              <TrMetricDelta style={{ color: pickDelta?.color ?? "#9ca3af" }}>
                {pickDelta ? `${pickDelta.sign} ${pickDelta.text}` : "—"}
              </TrMetricDelta>
            </TrMetricCell>

            <TrMetricCell>
              <TrMetricMain style={{ color: "#fed7aa" }}>
                {day.banRate.toFixed(2)}%
              </TrMetricMain>
              <TrMetricDelta style={{ color: banDelta?.color ?? "#9ca3af" }}>
                {banDelta ? `${banDelta.sign} ${banDelta.text}` : "—"}
              </TrMetricDelta>
            </TrMetricCell>
          </TrTableRow>
        );
      })}
    </TrTableWrap>
  );
}

// ---------- главный экран ----------
export default function TrendScreen({ onBack }) {
  const [champions, setChampions] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedChampion, setSelectedChampion] = useState(null);

  const [rankKey, setRankKey] = useState("diamondPlus");
  const [laneKey, setLaneKey] = useState("top");

  const [range, setRange] = useState("week");

  const [rawHistory, setRawHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadChampions() {
      try {
        const res = await fetch(`${API_BASE}/api/champions?lang=ru_ru`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        const list = (data || []).map((ch) => ({
          slug: ch.slug,
          displayName:
            typeof ch.name === "string" && ch.name.trim() ? ch.name : ch.slug,
        }));

        setChampions(list);
      } catch (e) {
        console.error("Ошибка загрузки champions", e);
      }
    }

    loadChampions();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedChampion) {
      setRawHistory(null);
      setHistoryError(null);
      return;
    }

    let cancelled = false;

    async function loadHistory() {
      setLoadingHistory(true);
      setHistoryError(null);

      try {
        const params = new URLSearchParams();
        params.set("slug", selectedChampion.slug);
        params.set("rank", rankKey);
        params.set("lane", laneKey);

        const res = await fetch(
          `${API_BASE}/api/champion-history?` + params.toString()
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        if (cancelled) return;

        const items = Array.isArray(json.items) ? json.items : [];
        setRawHistory(items);

        if (items.length === 0)
          setHistoryError("История для этого чемпиона пока не сохранена.");
        else setHistoryError(null);
      } catch (e) {
        console.error("Ошибка загрузки history", e);
        if (!cancelled) {
          setRawHistory([]);
          setHistoryError("Не удалось загрузить историю для этого чемпиона.");
        }
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [selectedChampion, rankKey, laneKey]);

  const days = useMemo(() => {
    if (!rawHistory || !Array.isArray(rawHistory)) return [];

    const mapped = rawHistory
      .map((item) => {
        const fullDate = item.date;
        let dateLabel = fullDate;

        let ts = null;
        try {
          const d = new Date(fullDate);
          if (!Number.isNaN(d.getTime())) {
            ts = d.getTime();
            dateLabel = d.toLocaleDateString("ru-RU", {
              day: "2-digit",
              month: "2-digit",
            });
          }
        } catch {
          // ignore
        }

        return {
          fullDate,
          date: dateLabel,
          ts,
          winRate: item.winRate ?? 0,
          pickRate: item.pickRate ?? 0,
          banRate: item.banRate ?? 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));

    if (range === "all") return mapped;

    const now = Date.now();
    const daysBack = range === "month" ? 30 : 7;
    const cutoff = now - daysBack * 24 * 60 * 60 * 1000;

    return mapped.filter((d) => d.ts == null || d.ts >= cutoff);
  }, [rawHistory, range]);

  const hasSelection = !!selectedChampion && days.length > 0;

  const isHistoryLoading = !!selectedChampion && loadingHistory;
  const historyErrorToShow =
    selectedChampion && !loadingHistory && historyError && !hasSelection
      ? historyError
      : null;

  const renderRangeButton = (value, label) => {
    const isActive = range === value;
    return (
      <TrRangeBtn
        key={value}
        type="button"
        onClick={() => setRange(value)}
        $active={isActive}
      >
        {label}
      </TrRangeBtn>
    );
  };

  const filters = (
    <>
      <TrSearchRow>
        <ChampionSearch
          champions={champions}
          value={search}
          onChange={setSearch}
          onSelect={(champ) => setSelectedChampion(champ)}
        />
      </TrSearchRow>

      <RankFilter value={rankKey} onChange={setRankKey} />
      <LaneFilter value={laneKey} onChange={setLaneKey} />

      <TrRangeRow>
        {renderRangeButton("week", "Неделя")}
        {renderRangeButton("month", "Месяц")}
        {renderRangeButton("all", "Всё")}
      </TrRangeRow>
    </>
  );

  return (
    <PageWrapper
      onBack={onBack}
      filters={filters}
      loading={isHistoryLoading}
      error={historyErrorToShow}
      loadingText="Загружаю историю…"
      wrapInCard
    >
      {!selectedChampion && !isHistoryLoading && !historyErrorToShow && (
        <TrHint>Выбери чемпиона, чтобы посмотреть его динамику.</TrHint>
      )}

      {hasSelection && (
        <>
          <TrendChartBlock days={days} />
          <TrendTable days={days} />
        </>
      )}
    </PageWrapper>
  );
}
