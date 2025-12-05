import { useEffect, useMemo, useState } from "react";
import PageWrapper from "../components/PageWrapper.jsx";
import TrendChartBlock from "../components/TrendCharts";
import { ChampionSearch } from "../components/ChampionSearch.jsx";
import { RankFilter } from "../components/RankFilter.jsx";
import { LaneFilter } from "../components/LaneFilter.jsx";

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
    <div
      style={{
        borderRadius: 12,
        background: "rgba(15,23,42,0.9)",
        padding: 6,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "70px repeat(3, 1fr)",
          padding: "4px 6px 6px",
          fontSize: 11,
          opacity: 0.8,
          borderBottom: "1px solid rgba(31,41,55,1)",
        }}
      >
        <div>Дата</div>
        <div style={{ textAlign: "right" }}>Победы</div>
        <div style={{ textAlign: "right" }}>Пики</div>
        <div style={{ textAlign: "right" }}>Баны</div>
      </div>

      {viewDays.map((day, index) => {
        const prev = index === viewDays.length - 1 ? null : viewDays[index + 1];

        const winDelta = prev ? getDelta(day.winRate, prev.winRate) : null;
        const pickDelta = prev ? getDelta(day.pickRate, prev.pickRate) : null;
        const banDelta = prev ? getDelta(day.banRate, prev.banRate) : null;

        return (
          <div
            key={day.fullDate}
            style={{
              display: "grid",
              gridTemplateColumns: "70px repeat(3, 1fr)",
              padding: "6px 6px",
              fontSize: 12,
              borderBottom:
                index === viewDays.length - 1
                  ? "none"
                  : "1px solid rgba(15,23,42,1)",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <span>{day.date}</span>
              <span style={{ fontSize: 10, opacity: 0.6 }}>{day.fullDate}</span>
            </div>

            <div
              style={{
                textAlign: "right",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <span style={{ fontSize: 13, color: "#e5e7eb" }}>
                {day.winRate.toFixed(2)}%
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: winDelta?.color ?? "#9ca3af",
                }}
              >
                {winDelta ? `${winDelta.sign} ${winDelta.text}` : "—"}
              </span>
            </div>

            <div
              style={{
                textAlign: "right",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <span style={{ fontSize: 13, color: "#93c5fd" }}>
                {day.pickRate.toFixed(2)}%
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: pickDelta?.color ?? "#9ca3af",
                }}
              >
                {pickDelta ? `${pickDelta.sign} ${pickDelta.text}` : "—"}
              </span>
            </div>

            <div
              style={{
                textAlign: "right",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <span style={{ fontSize: 13, color: "#fed7aa" }}>
                {day.banRate.toFixed(2)}%
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: banDelta?.color ?? "#9ca3af",
                }}
              >
                {banDelta ? `${banDelta.sign} ${banDelta.text}` : "—"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- главный экран ----------

export default function TrendScreen({ onBack }) {
  const [champions, setChampions] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedChampion, setSelectedChampion] = useState(null);

  const [rankKey, setRankKey] = useState("diamondPlus");
  const [laneKey, setLaneKey] = useState("top");

  const [rawHistory, setRawHistory] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // загружаем список чемпионов с API
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

  // загружаем history для выбранного чемпиона (через API)
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
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        if (cancelled) return;

        const items = Array.isArray(json.items) ? json.items : [];
        setRawHistory(items);

        if (items.length === 0) {
          setHistoryError("История для этого чемпиона пока не сохранена.");
        } else {
          setHistoryError(null);
        }
      } catch (e) {
        console.error("Ошибка загрузки history", e);
        if (!cancelled) {
          setRawHistory([]);
          setHistoryError("Не удалось загрузить историю для этого чемпиона.");
        }
      } finally {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [selectedChampion, rankKey, laneKey]);

  // превращаем history -> days для графика/таблицы
  const days = useMemo(() => {
    if (!rawHistory || !Array.isArray(rawHistory)) return [];

    return rawHistory
      .map((item) => {
        const fullDate = item.date;
        let dateLabel = fullDate;

        try {
          const d = new Date(fullDate);
          if (!Number.isNaN(d.getTime())) {
            dateLabel = d.toLocaleDateString("ru-RU", {
              day: "2-digit",
              month: "2-digit",
            });
          }
        } catch {
          // оставляем fullDate как есть
        }

        return {
          fullDate,
          date: dateLabel,
          winRate: item.winRate ?? 0,
          pickRate: item.pickRate ?? 0,
          banRate: item.banRate ?? 0,
        };
      })
      .filter(Boolean);
  }, [rawHistory]);

  const hasSelection = !!selectedChampion && days.length > 0;

  const isHistoryLoading = !!selectedChampion && loadingHistory;
  const historyErrorToShow =
    selectedChampion && !loadingHistory && historyError && !hasSelection
      ? historyError
      : null;

  const filters = (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 8,
        }}
      >
        <ChampionSearch
          champions={champions}
          value={search}
          onChange={setSearch}
          onSelect={(champ) => {
            setSelectedChampion(champ);
          }}
        />
      </div>

      <RankFilter value={rankKey} onChange={setRankKey} />
      <LaneFilter value={laneKey} onChange={setLaneKey} />
    </>
  );

  return (
    <PageWrapper
      onBack={onBack}
      filters={filters}
      loading={isHistoryLoading}
      error={historyErrorToShow}
      loadingText="Загружаю историю…"
    >
      {!selectedChampion && !isHistoryLoading && !historyErrorToShow && (
        <div
          style={{
            fontSize: 13,
            opacity: 0.8,
            textAlign: "center",
            paddingTop: 40,
          }}
        >
          Выбери чемпиона, чтобы посмотреть его динамику.
        </div>
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
