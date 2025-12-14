import { useEffect, useMemo, useState } from "react";
import PageWrapper from "../components/PageWrapper.jsx";
import { RankFilter } from "../components/RankFilter.jsx";
import { LaneFilter } from "../components/LaneFilter.jsx";
import { RANK_OPTIONS, LANE_OPTIONS } from "./constants";

// базовый урл до твоего API
const API_BASE = "https://wr-api-pjtu.vercel.app";

// аватарка чемпиона с синей заглушкой
function ChampAvatar({ name, src }) {
  return (
    <div className="wr-avatar">
      {src && <img src={src} alt={name} className="wr-avatarImg" />}
    </div>
  );
}

// helpers для цветов
function winRateColor(v) {
  if (v == null) return "inherit";
  if (v > 50) return "#4ade80";
  if (v < 50) return "#f97373";
  return "inherit";
}

function pickRateColor(v) {
  if (v == null) return "inherit";
  if (v < 3) return "#f97373";
  return "#4ade80";
}

function banRateColor(v) {
  if (v == null) return "inherit";
  if (v > 10) return "#f97373";
  return "#4ade80";
}

// маппинг strengthLevel -> тир + цвет (НОВАЯ шкала: 0 = S+, 5 = D)
function strengthToTier(level) {
  if (level == null) {
    return { label: "—", color: "#9ca3af" };
  }

  switch (level) {
    case 0:
      return { label: "S+", color: "#f97316" }; // имба
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

export function WinrateScreen({ language = "ru_ru", onBack }) {
  // чемпионы с API /api/champions
  const [champions, setChampions] = useState([]);
  // latest статы по (slug, rank, lane)
  const [latestStats, setLatestStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [rankKey, setRankKey] = useState("diamondPlus");
  const [laneKey, setLaneKey] = useState("top");

  const [sort, setSort] = useState({ column: "winRate", dir: "desc" });

  // загрузка чемпионов + истории из API
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // чемпы + вся история (один раз)
        const [champRes, histRes] = await Promise.all([
          fetch(
            `${API_BASE}/api/champions?lang=${encodeURIComponent(language)}`
          ),
          fetch(`${API_BASE}/api/champion-history`),
        ]);

        if (!champRes.ok) {
          throw new Error(`Champions HTTP ${champRes.status}`);
        }
        if (!histRes.ok) {
          throw new Error(`History HTTP ${histRes.status}`);
        }

        const champsJson = await champRes.json();
        const histJson = await histRes.json();

        if (cancelled) return;

        setChampions(champsJson || []);

        const items = Array.isArray(histJson.items) ? histJson.items : [];
        const latestMap = {};

        for (const item of items) {
          if (!item || !item.slug || !item.rank || !item.lane || !item.date) {
            continue;
          }
          const key = `${item.slug}|${item.rank}|${item.lane}`;
          const prev = latestMap[key];

          if (!prev) {
            latestMap[key] = item;
          } else {
            const prevDate = prev.date;
            const currDate = item.date;
            if (String(currDate) > String(prevDate)) {
              latestMap[key] = item;
            }
          }
        }

        setLatestStats(latestMap);
      } catch (e) {
        console.error("Ошибка загрузки данных для WinrateScreen", e);
        if (!cancelled) {
          setError("Не удалось загрузить статистику винрейтов.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [language]);

  // сортировка
  function onSort(column) {
    setSort((prev) => {
      if (prev.column !== column) {
        return { column, dir: "desc" };
      }
      if (prev.dir === "desc") return { column, dir: "asc" };
      if (prev.dir === "asc") return { column: null, dir: null };
      return { column, dir: "desc" };
    });
  }

  // подготовка строк для таблицы
  const rows = useMemo(() => {
    if (!champions.length || !latestStats) return [];

    return champions
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
      .filter(Boolean)
      .sort((a, b) => {
        if (!sort.column || !sort.dir) {
          return (b.winRate || 0) - (a.winRate || 0);
        }

        const col = sort.column;

        if (col === "strengthLevel") {
          const av = a.strengthLevel ?? 999;
          const bv = b.strengthLevel ?? 999;

          if (sort.dir === "desc") return av - bv;
          if (sort.dir === "asc") return bv - av;
          return 0;
        }

        const av = a[col] ?? 0;
        const bv = b[col] ?? 0;

        if (sort.dir === "desc") return bv - av;
        if (sort.dir === "asc") return av - bv;
        return 0;
      });
  }, [champions, latestStats, rankKey, laneKey, sort]);

  const filters = (
    <>
      <RankFilter value={rankKey} onChange={setRankKey} />
      <LaneFilter value={laneKey} onChange={setLaneKey} />
    </>
  );

  return (
    <PageWrapper
      onBack={onBack}
      filters={filters}
      loading={loading}
      error={!loading ? error : null}
      loadingText="Загружаю статистику…"
      wrapInCard
    >
      {/* media styles: мобилка ок, десктоп — ширина ограничена + крупнее */}
      <style>{`
        .wr-wrap {
          width: 100%;
          margin: 0 auto;
          max-width: 760px; /* по умолчанию (моб/планшет) */
        }

        /* общая сетка */
        .wr-grid {
          display: grid;
          grid-template-columns: 36px 2fr 0.7fr 0.9fr 0.9fr 0.9fr;
          column-gap: 4px;
          padding: 6px 8px;
          align-items: center;
        }

        .wr-header {
          font-size: 11px;
          opacity: 0.8;
          border-bottom: 1px solid rgba(31,41,55,1);
          position: sticky;
          top: 0;
          background: rgba(15,23,42,0.96);
          backdrop-filter: blur(8px);
          z-index: 1;
        }

        .wr-row {
          font-size: 12px;
          border-bottom: 1px solid rgba(15,23,42,1);
        }

        .wr-heroCell {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }
        .wr-heroName {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* аватар */
        .wr-avatar {
          width: 28px;
          height: 32px;
          border-radius: 4px;
          overflow: hidden;
          background: rgba(15, 23, 42, 0.85);
          flex-shrink: 0;
        }
        .wr-avatarImg {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .wr-right {
          text-align: right;
        }
        .wr-sortable {
          text-align: right;
          cursor: pointer;
        }

        /* DESKTOP */
        @media (min-width: 900px) {
          .wr-wrap {
            max-width: 1120px; /* перестаёт растягиваться на весь экран */
          }

          .wr-grid {
            grid-template-columns: 54px 2.6fr 0.9fr 1fr 1fr 1fr; /* чуть просторнее */
            column-gap: 10px;
            padding: 10px 12px;
          }

          .wr-header {
            font-size: 14px;
          }

          .wr-row {
            font-size: 14px;
          }

          .wr-avatar {
            width: 40px;
            height: 46px;
            border-radius: 8px;
          }

          .wr-heroCell {
            gap: 10px;
          }
        }

        /* WIDE DESKTOP */
        @media (min-width: 1280px) {
          .wr-wrap {
            max-width: 1240px;
          }
        }
      `}</style>

      <div className="wr-wrap">
        {/* заголовок таблицы */}
        <div className="wr-grid wr-header">
          <div>#</div>
          <div>Герой</div>

          <div className="wr-sortable" onClick={() => onSort("strengthLevel")}>
            Тир{" "}
            {sort.column === "strengthLevel"
              ? sort.dir === "asc"
                ? "▲"
                : "▼"
              : ""}
          </div>

          <div className="wr-sortable" onClick={() => onSort("winRate")}>
            Победы{" "}
            {sort.column === "winRate" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
          </div>
          <div className="wr-sortable" onClick={() => onSort("pickRate")}>
            Пики{" "}
            {sort.column === "pickRate" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
          </div>
          <div className="wr-sortable" onClick={() => onSort("banRate")}>
            Баны{" "}
            {sort.column === "banRate" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
          </div>
        </div>

        {rows.map((row, idx) => {
          const imgUrl = row.icon;

          return (
            <div key={row.slug} className="wr-grid wr-row">
              <div style={{ opacity: 0.8 }}>{idx + 1}</div>

              <div className="wr-heroCell">
                <ChampAvatar name={row.name} src={imgUrl} />
                <span className="wr-heroName">{row.name}</span>
              </div>

              <div
                className="wr-right"
                style={{
                  fontWeight: 700,
                  color: row.tierColor,
                }}
              >
                {row.tierLabel}
              </div>

              <div
                className="wr-right"
                style={{ color: winRateColor(row.winRate) }}
              >
                {row.winRate != null ? `${row.winRate.toFixed(2)}%` : "—"}
              </div>

              <div
                className="wr-right"
                style={{ color: pickRateColor(row.pickRate) }}
              >
                {row.pickRate != null ? `${row.pickRate.toFixed(2)}%` : "—"}
              </div>

              <div
                className="wr-right"
                style={{ color: banRateColor(row.banRate) }}
              >
                {row.banRate != null ? `${row.banRate.toFixed(2)}%` : "—"}
              </div>
            </div>
          );
        })}

        {!rows.length && !loading && (
          <div
            style={{
              padding: "10px 8px",
              fontSize: 13,
              opacity: 0.7,
            }}
          >
            Для выбранных фильтров данных нет.
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
