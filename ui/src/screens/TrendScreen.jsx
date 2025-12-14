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
    <div className="tr-tableWrap">
      <div className="tr-tableHead">
        <div>Дата</div>
        <div className="tr-right">Победы</div>
        <div className="tr-right">Пики</div>
        <div className="tr-right">Баны</div>
      </div>

      {viewDays.map((day, index) => {
        const prev = index === viewDays.length - 1 ? null : viewDays[index + 1];

        const winDelta = prev ? getDelta(day.winRate, prev.winRate) : null;
        const pickDelta = prev ? getDelta(day.pickRate, prev.pickRate) : null;
        const banDelta = prev ? getDelta(day.banRate, prev.banRate) : null;

        return (
          <div
            key={day.fullDate}
            className="tr-tableRow"
            style={{
              borderBottom:
                index === viewDays.length - 1
                  ? "none"
                  : "1px solid rgba(15,23,42,1)",
            }}
          >
            <div className="tr-dateCell">
              <span>{day.date}</span>
              <span className="tr-dateSub">{day.fullDate}</span>
            </div>

            <div className="tr-metricCell">
              <span className="tr-metricMain">{day.winRate.toFixed(2)}%</span>
              <span
                className="tr-metricDelta"
                style={{ color: winDelta?.color ?? "#9ca3af" }}
              >
                {winDelta ? `${winDelta.sign} ${winDelta.text}` : "—"}
              </span>
            </div>

            <div className="tr-metricCell">
              <span className="tr-metricMain" style={{ color: "#93c5fd" }}>
                {day.pickRate.toFixed(2)}%
              </span>
              <span
                className="tr-metricDelta"
                style={{ color: pickDelta?.color ?? "#9ca3af" }}
              >
                {pickDelta ? `${pickDelta.sign} ${pickDelta.text}` : "—"}
              </span>
            </div>

            <div className="tr-metricCell">
              <span className="tr-metricMain" style={{ color: "#fed7aa" }}>
                {day.banRate.toFixed(2)}%
              </span>
              <span
                className="tr-metricDelta"
                style={{ color: banDelta?.color ?? "#9ca3af" }}
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

  // диапазон времени: week | month | all
  // по умолчанию: неделя
  const [range, setRange] = useState("week");

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

  // превращаем history -> days (с фильтром по range)
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
          // оставляем как есть
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

    // если дата не парсится — оставляем, чтобы не "пропадали" записи
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
      <button
        key={value}
        type="button"
        onClick={() => setRange(value)}
        className="tr-rangeBtn"
        data-active={isActive ? "1" : "0"}
      >
        {label}
      </button>
    );
  };

  const filters = (
    <>
      <style>{`
        /* контейнер экрана */
        .tr-wrap {
          width: 100%;
          margin: 0 auto;
          max-width: 760px;
        }

        @media (min-width: 900px) {
          .tr-wrap {
            max-width: 1120px;
          }
        }

        @media (min-width: 1280px) {
          .tr-wrap {
            max-width: 1240px;
          }
        }

        .tr-searchRow {
          display: flex;
          justify-content: center;
          margin-bottom: 8px;
        }

        .tr-rangeRow {
          display: flex;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 8px;
          margin-bottom: 8px;
        }

        /* одинаковые кнопки диапазона */
        .tr-rangeBtn {
          box-sizing: border-box;
          width: 92px;
          height: 32px;
          padding: 0;
          font-size: 12px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.12s ease-out;
          background: rgba(15,23,42,0.95);
          color: #9ca3af;
          border: 1px solid rgba(75,85,99,0.9);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          user-select: none;
          font-weight: 600;
        }

        .tr-rangeBtn[data-active="1"] {
          border: 1px solid rgba(59,130,246,0.95);
          background: rgba(37,99,235,0.25);
          color: #e5e7eb;
        }

        @media (min-width: 900px) {
          .tr-rangeBtn {
            width: 120px;
            height: 36px;
            font-size: 13px;
          }
        }

        /* ====== ТАБЛИЦА (ВОТ ЧЕГО НЕ ХВАТАЛО) ====== */
        .tr-tableWrap {
          border-radius: 12px;
          background: rgba(15,23,42,0.9);
          padding: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tr-tableHead {
          display: grid;
          grid-template-columns: 70px repeat(3, 1fr);
          padding: 4px 6px 6px;
          font-size: 11px;
          opacity: 0.8;
          border-bottom: 1px solid rgba(31,41,55,1);
        }

        .tr-tableRow {
          display: grid;
          grid-template-columns: 70px repeat(3, 1fr);
          padding: 6px 6px;
          font-size: 12px;
        }

        .tr-right {
          text-align: right;
        }

        .tr-dateCell {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .tr-dateSub {
          font-size: 10px;
          opacity: 0.6;
        }

        .tr-metricCell {
          text-align: right;
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .tr-metricMain {
          font-size: 13px;
          color: #e5e7eb;
        }

        .tr-metricDelta {
          font-size: 10px;
        }

        @media (min-width: 900px) {
          .tr-tableHead {
            grid-template-columns: 120px repeat(3, 1fr);
            font-size: 14px;
            padding: 10px 10px;
          }

          .tr-tableRow {
            grid-template-columns: 120px repeat(3, 1fr);
            font-size: 14px;
            padding: 10px 10px;
          }

          .tr-dateSub {
            font-size: 12px;
          }

          .tr-metricMain {
            font-size: 16px;
          }

          .tr-metricDelta {
            font-size: 12px;
          }
        }
      `}</style>

      <div className="tr-searchRow">
        <ChampionSearch
          champions={champions}
          value={search}
          onChange={setSearch}
          onSelect={(champ) => setSelectedChampion(champ)}
        />
      </div>

      <RankFilter value={rankKey} onChange={setRankKey} />
      <LaneFilter value={laneKey} onChange={setLaneKey} />

      {/* под основными фильтрами */}
      <div className="tr-rangeRow">
        {renderRangeButton("week", "Неделя")}
        {renderRangeButton("month", "Месяц")}
        {renderRangeButton("all", "Всё")}
      </div>
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
      <div className="tr-wrap">
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
      </div>
    </PageWrapper>
  );
}
