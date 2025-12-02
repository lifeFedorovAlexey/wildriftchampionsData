// ui/src/screens/WinrateScreen.jsx
import { useEffect, useMemo, useState } from "react";
import PageWrapper from "../components/PageWrapper.jsx";
import { RankFilter } from "../components/RankFilter.jsx";
import { LaneFilter } from "../components/LaneFilter.jsx";
import { RANK_OPTIONS, LANE_OPTIONS } from "./constants"; // пока оставляю, логика завязана на ключах

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

export function WinrateScreen({ language = "ru_ru", onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [rankKey, setRankKey] = useState("diamondPlus");
  const [laneKey, setLaneKey] = useState("top");

  const [sort, setSort] = useState({ column: "winRate", dir: "desc" });

  const [champImages, setChampImages] = useState({});

  // загрузка cn-combined.json
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/cn-combined.json");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        console.error("Ошибка загрузки cn-combined.json", e);
        if (!cancelled) setError("Не удалось загрузить статистику винрейтов.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // загрузка картинок чемпионов
  useEffect(() => {
    if (!data || !Array.isArray(data.combined)) return;

    let cancelled = false;

    async function loadImages() {
      try {
        const entries = await Promise.all(
          data.combined.map(async (champ) => {
            const slug = champ.slug;
            if (!slug) return null;

            try {
              const res = await fetch(`/champions/${slug}.json`);
              if (!res.ok) return null;
              const json = await res.json();
              const url = json.baseImgUrl || json.img || json.icon || null;
              if (!url) return null;
              return [slug, url];
            } catch {
              return null;
            }
          })
        );

        if (cancelled) return;

        const map = {};
        for (const pair of entries) {
          if (!pair) continue;
          const [slug, url] = pair;
          map[slug] = url;
        }
        setChampImages(map);
      } catch (e) {
        if (!cancelled) {
          console.error("Ошибка загрузки картинок чемпионов", e);
        }
      }
    }

    loadImages();

    return () => {
      cancelled = true;
    };
  }, [data]);

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

  // подготовка строк
  const rows = useMemo(() => {
    if (!data || !Array.isArray(data.combined)) return [];

    return data.combined
      .map((champ) => {
        const statsForRank = champ.cnStats?.[rankKey];
        const cell = statsForRank?.[laneKey];
        if (!cell) return null;

        let displayName = champ.slug;
        if (typeof champ.name === "string") {
          displayName = champ.name;
        } else if (champ.name && typeof champ.name === "object") {
          displayName =
            champ.name[language] ||
            champ.name.ru_ru ||
            champ.name.en_us ||
            champ.slug;
        }

        return {
          slug: champ.slug,
          name: displayName,
          winRate: cell.winRate ?? null,
          pickRate: cell.pickRate ?? null,
          banRate: cell.banRate ?? null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (!sort.column || !sort.dir) {
          return (b.winRate || 0) - (a.winRate || 0);
        }

        const col = sort.column;
        const av = a[col] ?? 0;
        const bv = b[col] ?? 0;

        if (sort.dir === "desc") return bv - av;
        if (sort.dir === "asc") return av - bv;
        return 0;
      });
  }, [data, rankKey, laneKey, language, sort]);

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
          gridTemplateColumns: "36px 2fr 0.9fr 0.9fr 0.9fr",
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
        const imgUrl = champImages[row.slug];

        return (
          <div
            key={row.slug}
            style={{
              display: "grid",
              gridTemplateColumns: "36px 2fr 0.9fr 0.9fr 0.9fr",
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

      {!rows.length && (
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
