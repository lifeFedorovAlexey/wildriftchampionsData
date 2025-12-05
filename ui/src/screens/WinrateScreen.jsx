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
    <div
      style={{
        width: 28,
        height: 32,
        borderRadius: 4,
        overflow: "hidden",
        background: "rgba(15, 23, 42, 0.85)", // фон-заглушка
        flexShrink: 0,
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

// маппинг strengthLevel -> тир + цвет
function strengthToTier(level) {
  if (level == null) {
    return { label: "—", color: "#9ca3af" };
  }

  switch (level) {
    case 5:
      return { label: "S+", color: "#f97316" }; // имба
    case 4:
      return { label: "S", color: "#f97316" };
    case 3:
      return { label: "A", color: "#22c55e" };
    case 2:
      return { label: "B", color: "#eab308" };
    case 1:
      return { label: "C", color: "#9ca3af" };
    case 0:
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

        // champions: просто сохраняем список как есть
        setChampions(champsJson || []);

        // histJson.items — массив:
        // {
        //   date, slug, cnHeroId, rank, lane,
        //   position, winRate, pickRate, banRate, strengthLevel
        // }
        const items = Array.isArray(histJson.items) ? histJson.items : [];

        // Собираем latest map:
        // key = `${slug}|${rank}|${lane}`
        // value = самая свежая запись по date
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
        if (!stat) return null; // для этого чемпа нет данных по выбранным rank/lane

        // имя уже локализовано бэком по ?lang=
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
          // дефолт — по winRate desc
          return (b.winRate || 0) - (a.winRate || 0);
        }

        const col = sort.column;

        // для strengthLevel хотим сортировать по числу
        if (col === "strengthLevel") {
          const av = a.strengthLevel ?? -1;
          const bv = b.strengthLevel ?? -1;
          if (sort.dir === "desc") return bv - av;
          if (sort.dir === "asc") return av - bv;
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
      {/* фильтры рангов */}
      <RankFilter value={rankKey} onChange={setRankKey} />

      {/* фильтры линий */}
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
      {/* заголовок таблицы */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "36px 2fr 0.7fr 0.9fr 0.9fr 0.9fr",
          columnGap: 4,
          padding: "6px 8px",
          fontSize: 11,
          opacity: 0.8,
          borderBottom: "1px solid rgba(31,41,55,1)",
          position: "sticky",
          top: 0,
          background: "rgba(15,23,42,0.96)",
          backdropFilter: "blur(8px)",
          zIndex: 1,
        }}
      >
        <div>#</div>
        <div>Герой</div>

        <div
          style={{ textAlign: "right", cursor: "pointer" }}
          onClick={() => onSort("strengthLevel")}
        >
          Тир{" "}
          {sort.column === "strengthLevel"
            ? sort.dir === "asc"
              ? "▲"
              : "▼"
            : ""}
        </div>

        <div
          style={{ textAlign: "right", cursor: "pointer" }}
          onClick={() => onSort("winRate")}
        >
          Победы{" "}
          {sort.column === "winRate" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
        </div>
        <div
          style={{ textAlign: "right", cursor: "pointer" }}
          onClick={() => onSort("pickRate")}
        >
          Пики{" "}
          {sort.column === "pickRate" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
        </div>
        <div
          style={{ textAlign: "right", cursor: "pointer" }}
          onClick={() => onSort("banRate")}
        >
          Баны{" "}
          {sort.column === "banRate" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
        </div>
      </div>

      {rows.map((row, idx) => {
        const imgUrl = row.icon;

        return (
          <div
            key={row.slug}
            style={{
              display: "grid",
              gridTemplateColumns: "36px 2fr 0.7fr 0.9fr 0.9fr 0.9fr",
              columnGap: 4,
              padding: "6px 8px",
              fontSize: 12,
              borderBottom: "1px solid rgba(15,23,42,1)",
              alignItems: "center",
            }}
          >
            <div style={{ opacity: 0.8 }}>{idx + 1}</div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                minWidth: 0,
              }}
            >
              <ChampAvatar name={row.name} src={imgUrl} />

              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.name}
              </span>
            </div>

            <div
              style={{
                textAlign: "right",
                fontWeight: 600,
                color: row.tierColor,
              }}
            >
              {row.tierLabel}
            </div>

            <div
              style={{
                textAlign: "right",
                color: winRateColor(row.winRate),
              }}
            >
              {row.winRate != null ? `${row.winRate.toFixed(2)}%` : "—"}
            </div>
            <div
              style={{
                textAlign: "right",
                color: pickRateColor(row.pickRate),
              }}
            >
              {row.pickRate != null ? `${row.pickRate.toFixed(2)}%` : "—"}
            </div>
            <div
              style={{
                textAlign: "right",
                color: banRateColor(row.banRate),
              }}
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
    </PageWrapper>
  );
}
