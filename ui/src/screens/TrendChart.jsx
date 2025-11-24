// ui/src/screens/TrendScreen.jsx
import { useEffect, useMemo, useState } from "react";
import PageWrapper from "../components/PageWrapper.jsx";
import {
  RANK_OPTIONS,
  LANE_OPTIONS,
  ROLE_SPRITE_URL,
  ROLE_ICON_SPRITE,
} from "./constants";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// ---------- маленький компонент иконки роли (как в винрейтах) ----------

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

// ---------- поиск чемпиона ----------

function ChampionSearch({ champions, value, onChange, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return champions.slice(0, 25);

    return champions
      .filter((c) => {
        const name = (c.displayName || "").toLowerCase();
        const slug = (c.slug || "").toLowerCase();
        return name.includes(q) || slug.includes(q);
      })
      .slice(0, 25);
  }, [champions, value]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 360,
      }}
    >
      <input
        type="text"
        placeholder="Поиск чемпиона…"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 999,
          border: "1px solid rgba(55,65,81,1)",
          background: "rgba(15,23,42,0.9)",
          color: "#e5e7eb",
          fontSize: 13,
          outline: "none",
        }}
      />

      {isOpen && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            maxHeight: 260,
            overflowY: "auto",
            background: "rgba(15,23,42,0.98)",
            borderRadius: 12,
            border: "1px solid rgba(31,41,55,1)",
            zIndex: 20,
          }}
        >
          {filtered.map((champ) => (
            <button
              key={champ.slug}
              type="button"
              onClick={() => {
                onSelect(champ);
                onChange(champ.displayName);
                setIsOpen(false);
              }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "6px 10px",
                border: "none",
                background: "transparent",
                color: "#e5e7eb",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 13 }}>{champ.displayName}</div>
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.6,
                }}
              >
                {champ.slug}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- график ----------

function TrendChartBlock({ days }) {
  if (!days || !days.length) return null;

  const formatPercent = (v) => `${v.toFixed(2)}%`;

  return (
    <div
      style={{
        borderRadius: 12,
        background: "rgba(15,23,42,0.95)",
        padding: 8,
        marginBottom: 10,
      }}
    >
      <div
        style={{
          fontSize: 13,
          opacity: 0.85,
          padding: "4px 4px 8px",
        }}
      >
        Динамика винрейта / пикрейта / банрейта за последние {days.length} дней
      </div>

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={days}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="trendWin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#4ade80" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="trendPick" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id="trendBan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0.03} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke="#1f2933" strokeDasharray="3 3" />

            <XAxis
              dataKey="date"
              tick={{ fill: "#9ba3b4", fontSize: 10 }}
              tickMargin={6}
              axisLine={{ stroke: "#2a3240" }}
              height={26}
              interval="preserveStartEnd"
            />

            <YAxis
              tickFormatter={formatPercent}
              tick={{ fill: "#9ba3b4", fontSize: 10 }}
              axisLine={{ stroke: "#2a3240" }}
              width={56}
            />

            <Tooltip
              formatter={(value) => formatPercent(Number(value))}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.fullDate ?? ""
              }
              contentStyle={{
                background: "#111623",
                border: "1px solid #242b3a",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "#ffffff", marginBottom: 4 }}
            />

            <Area
              type="monotone"
              dataKey="winRate"
              name="Победы"
              stroke="#4ade80"
              strokeWidth={2}
              fill="url(#trendWin)"
              activeDot={{ r: 4 }}
            />

            <Area
              type="monotone"
              dataKey="pickRate"
              name="Пики"
              stroke="#60a5fa"
              strokeWidth={1.6}
              fill="url(#trendPick)"
              activeDot={{ r: 3 }}
            />

            <Area
              type="monotone"
              dataKey="banRate"
              name="Баны"
              stroke="#f97316"
              strokeWidth={1.6}
              fill="url(#trendBan)"
              activeDot={{ r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---------- таблица ----------

function TrendTable({ days }) {
  if (!days || !days.length) return null;

  const getDelta = (current, prev) => {
    if (prev == null) return null;
    const diff = Number((current - prev).toFixed(2));

    if (Math.abs(diff) < 0.01)
      return { sign: "→", text: "0.00", color: "#9ca3af" };

    if (diff > 0)
      return { sign: "↑", text: `+${diff.toFixed(2)}`, color: "#4ade80" };

    return { sign: "↓", text: diff.toFixed(2), color: "#f97373" };
  };

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

      {days.map((day, index) => {
        const prev = days[index + 1];

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
                index === days.length - 1
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

  // загружаем список чемпионов из cn-combined.json
  useEffect(() => {
    fetch("/cn-combined.json")
      .then((res) => res.json())
      .then((data) => {
        const list = (data?.combined || []).map((champ) => {
          let displayName = champ.slug;
          if (typeof champ.name === "string") {
            displayName = champ.name;
          } else if (champ.name && typeof champ.name === "object") {
            displayName =
              champ.name.ru_ru ||
              champ.name.en_us ||
              Object.values(champ.name)[0] ||
              champ.slug;
          }
          return {
            slug: champ.slug,
            displayName,
          };
        });
        setChampions(list);
      })
      .catch(() => {});
  }, []);

  // загружаем history для выбранного чемпиона
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
        const res = await fetch(
          `/history/champions/${selectedChampion.slug}.json`
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        if (!cancelled) {
          setRawHistory(Array.isArray(json.history) ? json.history : []);
        }
      } catch (e) {
        console.error("Ошибка загрузки history", e);
        if (!cancelled) {
          setRawHistory([]);
          setHistoryError("История для этого чемпиона пока не сохранена.");
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
  }, [selectedChampion]);

  // превращаем history -> days для графика/таблицы с учётом rank+lane
  const days = useMemo(() => {
    if (!rawHistory || !Array.isArray(rawHistory)) return [];

    return rawHistory
      .map((entry) => {
        const rankStats = entry.cnStats?.[rankKey];
        if (!rankStats) return null;
        const laneStats = rankStats?.[laneKey];
        if (!laneStats) return null;

        const fullDate = entry.date;
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
          winRate: laneStats.winRate ?? 0,
          pickRate: laneStats.pickRate ?? 0,
          banRate: laneStats.banRate ?? 0,
        };
      })
      .filter(Boolean);
  }, [rawHistory, rankKey, laneKey]);

  const hasSelection = !!selectedChampion && days.length > 0;

  // фильтры сверху (чемп + ранг + линия)
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

      {/* фильтры рангов — как в WinrateScreen */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          justifyContent: "center",
          marginBottom: 4,
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

      {/* фильтры линий — как в WinrateScreen */}
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
    </>
  );

  return (
    <PageWrapper onBack={onBack} filters={filters}>
      {!selectedChampion && (
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

      {selectedChampion && loadingHistory && (
        <div
          style={{
            fontSize: 13,
            opacity: 0.8,
            textAlign: "center",
            paddingTop: 40,
          }}
        >
          Загружаю историю…
        </div>
      )}

      {selectedChampion && !loadingHistory && historyError && !hasSelection && (
        <div
          style={{
            fontSize: 13,
            opacity: 0.8,
            textAlign: "center",
            paddingTop: 40,
          }}
        >
          {historyError}
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
