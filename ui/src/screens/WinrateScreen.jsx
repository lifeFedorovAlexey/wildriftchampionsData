import { useEffect, useMemo, useState } from "react";
import {
  RANK_OPTIONS,
  LANE_OPTIONS,
  ROLE_SPRITE_URL,
  ROLE_ICON_SPRITE,
} from "./constants";

// маленький компонент иконки роли
function RoleIcon({ laneKey, size = 24 }) {
  const cfg = ROLE_ICON_SPRITE[laneKey];
  if (!cfg) return null;

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${ROLE_SPRITE_URL})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: `${cfg.x}px ${cfg.y}px`,
        backgroundSize: "205px 28px",
        flexShrink: 0,
      }}
    />
  );
}

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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        paddingBottom: 12,
      }}
    >
      {/* верхняя панель */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            border: "none",
            borderRadius: 999,
            padding: "4px 10px",
            fontSize: 13,
            cursor: "pointer",
            background: "rgba(15,23,42,0.9)",
            color: "inherit",
          }}
        >
          Меню
        </button>
      </div>

      {/* фильтры */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          marginBottom: 10,
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            justifyContent: "center",
          }}
        >
          {RANK_OPTIONS.map((opt) => {
            const active = opt.key === rankKey;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setRankKey(opt.key)}
                style={{
                  borderRadius: 999,
                  border: active
                    ? "1px solid rgba(96,165,250,1)"
                    : "1px solid rgba(31,41,55,1)",
                  background: active ? "rgba(37,99,235,0.3)" : "transparent",
                  padding: "4px 8px",
                  fontSize: 11,
                  cursor: "pointer",
                  color: "inherit",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            justifyContent: "center",
          }}
        >
          {LANE_OPTIONS.map((opt) => {
            const active = opt.key === laneKey;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setLaneKey(opt.key)}
                title={opt.label}
                style={{
                  borderRadius: 999,
                  border: active
                    ? "1px solid rgba(52,211,153,1)"
                    : "1px solid rgba(31,41,55,1)",
                  background: active ? "rgba(16,185,129,0.25)" : "transparent",
                  padding: "4px 8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <RoleIcon laneKey={opt.key} size={30} />
              </button>
            );
          })}
        </div>
      </div>

      {/* контент */}
      {loading && (
        <div
          style={{
            fontSize: 13,
            opacity: 0.85,
          }}
        >
          Загружаю статистику…
        </div>
      )}

      {error && !loading && (
        <div
          style={{
            fontSize: 13,
            padding: "6px 8px",
            borderRadius: 8,
            background: "#402020",
            marginBottom: 8,
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && (
        <div
          style={{
            borderRadius: 10,
            background: "rgba(15,23,42,0.85)",
          }}
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
              {sort.column === "winRate"
                ? sort.dir === "asc"
                  ? "▲"
                  : "▼"
                : ""}
            </div>
            <div
              style={{ textAlign: "right", cursor: "pointer" }}
              onClick={() => onSort("pickRate")}
            >
              Пики{" "}
              {sort.column === "pickRate"
                ? sort.dir === "asc"
                  ? "▲"
                  : "▼"
                : ""}
            </div>
            <div
              style={{ textAlign: "right", cursor: "pointer" }}
              onClick={() => onSort("banRate")}
            >
              Баны{" "}
              {sort.column === "banRate"
                ? sort.dir === "asc"
                  ? "▲"
                  : "▼"
                : ""}
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
        </div>
      )}
    </div>
  );
}
