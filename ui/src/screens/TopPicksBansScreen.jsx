import { useEffect, useMemo, useState } from "react";
import PageWrapper from "../components/PageWrapper.jsx";

const API_BASE = "https://wr-api-pjtu.vercel.app";

// порядок рангов и их русские названия
const RANK_KEYS = ["diamondPlus", "masterPlus", "king", "peak"];
const RANK_LABELS_RU = {
  diamondPlus: "алмаз",
  masterPlus: "мастер",
  king: "гм",
  peak: "чалик",
};

const EXCLUDED_RANK_KEYS = new Set(["overall"]);

// группы эло
const LOW_ELO_RANKS = new Set(["diamondPlus", "masterPlus"]);
const HIGH_ELO_RANKS = new Set(["king", "peak"]);

// аватарка чемпиона
function ChampAvatarCard({ name, src }) {
  return (
    <div
      style={{
        width: 40,
        height: 44,
        borderRadius: 8,
        overflow: "hidden",
        background: "rgba(15, 23, 42, 0.9)",
        border: "1px solid rgba(51, 65, 85, 0.9)",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {src && (
        <img
          src={src}
          alt={name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      )}
    </div>
  );
}

// карточка топ-чемпиона (краткая инфа + клик)
function TopChampCard({ index, champ, type, imgUrl, onClick }) {
  const totalValue =
    type === "pick" ? champ.totalPickRate || 0 : champ.totalBanRate || 0;

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 12,
        border:
          type === "pick"
            ? "1px solid rgba(96, 165, 250, 0.9)"
            : "1px solid rgba(248, 113, 113, 0.9)",
        background:
          type === "pick"
            ? "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,64,175,0.85))"
            : "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(185,28,28,0.85))",
        padding: 10,
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 10px 25px rgba(15,23,42,0.9)",
        overflow: "hidden",
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          opacity: 0.9,
          minWidth: 24,
          textAlign: "center",
        }}
      >
        #{index + 1}
      </div>

      <ChampAvatarCard name={champ.name} src={imgUrl} />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          minWidth: 0,
          flex: 1,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {champ.name}
        </div>
        <div style={{ fontSize: 11, opacity: 0.8 }}>
          ({champ.slug}) —{" "}
          {type === "pick" ? "совокупный пикрейт" : "совокупный банрейт"}:{" "}
          <span style={{ fontWeight: 600 }}>{totalValue.toFixed(2)}%</span>
        </div>
      </div>

      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          textAlign: "right",
          minWidth: 70,
        }}
      >
        {totalValue.toFixed(2)}%
      </div>
    </div>
  );
}

// модальное окно с полной статистикой
function DetailsModal({ data, onClose }) {
  if (!data) return null;

  const { index, champ, type } = data;
  const totalValue =
    type === "pick" ? champ.totalPickRate || 0 : champ.totalBanRate || 0;
  const totalLabel = type === "pick" ? "totalPickRate" : "totalBanRate";

  const lanes = champ.lanes || {};

  // для пиков — детали по линиям, для банов — только элементы с ban > 0
  const laneEntries = Object.entries(lanes)
    .filter(([, laneData]) => {
      const val = type === "pick" ? laneData.pick || 0 : laneData.ban || 0;
      return val > 0;
    })
    .sort(([, a], [, b]) => {
      const av = type === "pick" ? a.pick || 0 : a.ban || 0;
      const bv = type === "pick" ? b.pick || 0 : b.ban || 0;
      return bv - av;
    });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.8)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "rgba(15,23,42,0.98)",
          borderRadius: 12,
          border: "1px solid rgba(148,163,184,0.7)",
          maxWidth: 520,
          width: "90%",
          maxHeight: "80vh",
          padding: 14,
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
          fontSize: 12,
          color: "#e5e7eb",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 8,
            gap: 8,
          }}
        >
          <div>
            <div style={{ marginBottom: 4 }}>
              {index + 1}. {champ.name.toUpperCase()} ({champ.slug}) —{" "}
              {totalLabel}: <b>{totalValue.toFixed(2)}%</b>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              color: "#9ca3af",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {laneEntries.map(([laneKey, laneData]) => {
          const laneTotal =
            type === "pick" ? laneData.pick || 0 : laneData.ban || 0;

          const ranksObj =
            type === "pick"
              ? laneData.pickRanks || {}
              : laneData.banRanks || {};

          const parts = [];
          for (const rk of RANK_KEYS) {
            if (!ranksObj[rk] || EXCLUDED_RANK_KEYS.has(rk)) continue;
            const label = RANK_LABELS_RU[rk] || rk;
            parts.push(`${label}: ${ranksObj[rk].toFixed(2)}%`);
          }

          const displayLaneName =
            type === "ban" && laneKey === "all" ? "все линии" : laneKey;

          return (
            <div key={laneKey} style={{ marginBottom: 4 }}>
              - {displayLaneName}: {laneTotal.toFixed(2)}%
              {parts.length > 0 && <> (из них: {parts.join(", ")})</>}
            </div>
          );
        })}

        {!laneEntries.length && (
          <div>Для этого чемпиона нет детальной статистики.</div>
        )}
      </div>
    </div>
  );
}

function TopPicksBansScreen({ language = "ru_ru", onBack }) {
  const [champions, setChampions] = useState([]);
  const [champImages, setChampImages] = useState({});
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState(null);
  const [limit, setLimit] = useState(5); // 5 | 10 | 20 | "all"

  // новый фильтр по эло: low | high | all
  const [rankRange, setRankRange] = useState("low");

  // загружаем чемпионов и иконки
  useEffect(() => {
    let cancelled = false;

    async function loadChampions() {
      try {
        const res = await fetch(
          `${API_BASE}/api/champions?lang=${encodeURIComponent(language)}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;

        setChampions(json || []);

        const imgMap = {};
        (json || []).forEach((ch) => {
          if (ch.slug) {
            imgMap[ch.slug] = ch.icon || null;
          }
        });
        setChampImages(imgMap);
      } catch (e) {
        console.error("Ошибка загрузки champions", e);
      }
    }

    loadChampions();

    return () => {
      cancelled = true;
    };
  }, [language]);

  // загружаем всю историю из API
  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/champion-history`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;

        const items = Array.isArray(json.items) ? json.items : [];
        setHistoryItems(items);
      } catch (e) {
        console.error("Ошибка загрузки champion-history", e);
        if (!cancelled) {
          setError("Не удалось загрузить статистику пиков и банов.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  // агрегируем статистику ЗА ПОСЛЕДНИЙ ДЕНЬ для каждого чемпиона
  const aggregated = useMemo(() => {
    if (!Array.isArray(historyItems) || historyItems.length === 0) return [];

    // 1) находим последнюю дату для каждого slug
    const lastDateBySlug = {};
    for (const item of historyItems) {
      if (!item || !item.slug || !item.date) continue;
      const slug = item.slug;
      const dateStr = String(item.date);
      if (!lastDateBySlug[slug] || dateStr > lastDateBySlug[slug]) {
        lastDateBySlug[slug] = dateStr;
      }
    }

    // 2) фильтруем только записи за последнюю дату для данного slug
    const latestItems = historyItems.filter((item) => {
      if (!item || !item.slug || !item.date) return false;
      const dateStr = String(item.date);
      return dateStr === lastDateBySlug[item.slug];
    });

    // 3) champions map для имён
    const champBySlug = {};
    for (const ch of champions) {
      if (!ch || !ch.slug) continue;
      champBySlug[ch.slug] = ch;
    }

    // 4) считаем агрегаты с учётом фильтра rankRange
    const aggBySlug = new Map();

    for (const item of latestItems) {
      const slug = item.slug;
      const rankKey = item.rank;
      const laneKey = item.lane;

      if (!slug || !rankKey || !laneKey) continue;
      if (EXCLUDED_RANK_KEYS.has(rankKey)) continue;

      // фильтр по эло
      if (rankRange === "low" && !LOW_ELO_RANKS.has(rankKey)) continue;
      if (rankRange === "high" && !HIGH_ELO_RANKS.has(rankKey)) continue;
      // rankRange === "all" — пропускаем всё кроме overall

      const pickRate = item.pickRate ?? 0;
      const banRate = item.banRate ?? 0;

      if (!aggBySlug.has(slug)) {
        const champion = champBySlug[slug];
        let displayName = slug;
        if (champion && typeof champion.name === "string" && champion.name) {
          displayName = champion.name;
        }

        aggBySlug.set(slug, {
          slug,
          name: displayName,
          totalPickRate: 0,
          totalBanRate: 0,
          lanes: {
            all: {
              pick: 0,
              ban: 0,
              pickRanks: {},
              banRanks: {},
            },
          },
          _banRanksAdded: new Set(), // внутренняя служебная штука
        });
      }

      const agg = aggBySlug.get(slug);
      const lanes = agg.lanes;

      if (!lanes[laneKey]) {
        lanes[laneKey] = {
          pick: 0,
          ban: 0,
          pickRanks: {},
          banRanks: {},
        };
      }

      // ПИКИ: считаем по линиям + по рангам
      agg.totalPickRate += pickRate;
      lanes[laneKey].pick += pickRate;
      lanes[laneKey].pickRanks[rankKey] =
        (lanes[laneKey].pickRanks[rankKey] || 0) + pickRate;

      // БАНЫ: один раз на ранг, без деления по линиям
      if (!agg._banRanksAdded.has(rankKey)) {
        agg.totalBanRate += banRate;
        lanes.all.ban += banRate;
        lanes.all.banRanks[rankKey] =
          (lanes.all.banRanks[rankKey] || 0) + banRate;
        agg._banRanksAdded.add(rankKey);
      }
    }

    // 5) превращаем Map -> массив и выбрасываем _banRanksAdded
    const result = [];
    for (const value of aggBySlug.values()) {
      const { _banRanksAdded, ...rest } = value;
      if (rest.totalPickRate === 0 && rest.totalBanRate === 0) continue;
      result.push(rest);
    }

    return result;
  }, [historyItems, champions, rankRange]);

  // сортировки + лимит
  const topPicks = useMemo(() => {
    const sorted = [...aggregated].sort(
      (a, b) => (b.totalPickRate || 0) - (a.totalPickRate || 0)
    );
    if (limit === "all") return sorted;
    return sorted.slice(0, limit);
  }, [aggregated, limit]);

  const topBans = useMemo(() => {
    const sorted = [...aggregated].sort(
      (a, b) => (b.totalBanRate || 0) - (a.totalBanRate || 0)
    );
    if (limit === "all") return sorted;
    return sorted.slice(0, limit);
  }, [aggregated, limit]);

  const limitLabel =
    limit === "all" ? "все чемпионы" : `топ-${limit} чемпионов`;
  const limitTitlePrefix = limit === "all" ? "Все чемпионы" : `Топ-${limit}`;

  const rankRangeLabel =
    rankRange === "low"
      ? "в алмазе+мастере"
      : rankRange === "high"
      ? "в гм+чалике"
      : "во всех рангах";

  const renderLimitButton = (value, label) => {
    const isActive = limit === value;
    return (
      <button
        key={String(value)}
        onClick={() => setLimit(value)}
        style={{
          padding: "4px 10px",
          fontSize: 12,
          borderRadius: 999,
          border: isActive
            ? "1px solid rgba(59,130,246,0.9)"
            : "1px solid rgba(75,85,99,0.9)",
          background: isActive ? "rgba(37,99,235,0.25)" : "rgba(15,23,42,0.95)",
          color: isActive ? "#e5e7eb" : "#9ca3af",
          cursor: "pointer",
          transition: "all 0.12s ease-out",
          minWidth: 44,
        }}
      >
        {label}
      </button>
    );
  };

  const renderRankRangeButton = (value, label) => {
    const isActive = rankRange === value;
    return (
      <button
        key={value}
        onClick={() => setRankRange(value)}
        style={{
          padding: "4px 10px",
          fontSize: 12,
          borderRadius: 999,
          border: isActive
            ? "1px solid rgba(52,211,153,0.9)"
            : "1px solid rgba(75,85,99,0.9)",
          background: isActive ? "rgba(16,185,129,0.2)" : "rgba(15,23,42,0.95)",
          color: isActive ? "#e5e7eb" : "#9ca3af",
          cursor: "pointer",
          transition: "all 0.12s ease-out",
          minWidth: 70,
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <PageWrapper
      onBack={onBack}
      filters={null}
      loading={loading}
      error={!loading ? error : null}
      loadingText="Считаю пики и баны…"
      wrapInCard
    >
      {/* Переключатель количества записей */}
      <div
        style={{
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          flexWrap: "wrap",
          padding: "10px 5px",
        }}
      >
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          Ниже — {limitLabel} по суммарному пикрейту и банрейту за последний
          день {rankRangeLabel} и на всех линиях. Нажми на карточку чемпиона,
          чтобы увидеть подробную раскладку по ролям и рангам.
        </div>
      </div>
      {/* Фильтр по поличеству */}
      <div
        style={{
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 6,
          flexWrap: "wrap",
          padding: "5px",
        }}
      >
        {renderLimitButton(5, "Топ 5")}
        {renderLimitButton(10, "Топ 10")}
        {renderLimitButton(20, "Топ 20")}
        {renderLimitButton("all", "Все")}
      </div>

      {/* Фильтр по эло */}
      <div
        style={{
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 6,
          flexWrap: "wrap",
          padding: "5px",
        }}
      >
        {renderRankRangeButton("low", "Лоу эло")}
        {renderRankRangeButton("high", "Хай эло")}
        {renderRankRangeButton("all", "Все ранги")}
      </div>

      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 6,
            padding: "5px",
          }}
        >
          {limitTitlePrefix} по пикам
        </div>
        {topPicks.map((champ, idx) => {
          const imgUrl = champImages[champ.slug];
          return (
            <div key={`pick-${champ.slug}`} style={{ marginBottom: 8 }}>
              <TopChampCard
                index={idx}
                champ={champ}
                type="pick"
                imgUrl={imgUrl}
                onClick={() => setDetails({ index: idx, champ, type: "pick" })}
              />
            </div>
          );
        })}
        {!topPicks.length && (
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Нет данных для расчёта пиков.
          </div>
        )}
      </div>

      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          {limitTitlePrefix} по банам
        </div>
        {topBans.map((champ, idx) => {
          const imgUrl = champImages[champ.slug];
          return (
            <div key={`ban-${champ.slug}`} style={{ marginBottom: 8 }}>
              <TopChampCard
                index={idx}
                champ={champ}
                type="ban"
                imgUrl={imgUrl}
                onClick={() => setDetails({ index: idx, champ, type: "ban" })}
              />
            </div>
          );
        })}
        {!topBans.length && (
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Нет данных для расчёта банов.
          </div>
        )}
      </div>

      <DetailsModal data={details} onClose={() => setDetails(null)} />
    </PageWrapper>
  );
}

export default TopPicksBansScreen;
