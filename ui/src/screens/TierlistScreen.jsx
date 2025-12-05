import { useEffect, useState } from "react";
import PageWrapper from "../components/PageWrapper.jsx";
import { RankFilter } from "../components/RankFilter.jsx";
import { LaneFilter } from "../components/LaneFilter.jsx";

// базовый урл до твоего API
const API_BASE = "https://wr-api-pjtu.vercel.app";

// маппинг тира -> цвет бейджа
function tierColor(tier) {
  switch (tier) {
    case "S+":
      return "#f97316"; // яркий оранжевый
    case "S":
      return "#fb923c";
    case "A":
      return "#22c55e";
    case "B":
      return "#eab308";
    case "C":
      return "#9ca3af";
    case "D":
    default:
      return "#6b7280";
  }
}

// карточка чемпиона в тир-листе
function TierChampionCard({ champ }) {
  return (
    <div
      style={{
        width: 80,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: 4,
        borderRadius: 10,
        background: "rgba(15,23,42,0.9)",
        border: "1px solid rgba(30,64,175,0.4)",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 8,
          overflow: "hidden",
          background: "rgba(15,23,42,0.95)",
          border: "1px solid rgba(51,65,85,0.95)",
        }}
      >
        {champ.icon && (
          <img
            src={champ.icon}
            alt={champ.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        )}
      </div>
      <div
        style={{
          fontSize: 10,
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          width: "100%",
        }}
      >
        {champ.name}
      </div>
      <div
        style={{
          fontSize: 9,
          opacity: 0.75,
          textAlign: "center",
        }}
      >
        {champ.winRate != null ? `${champ.winRate.toFixed(1)}% WR` : ""}
      </div>
    </div>
  );
}

// ряд одного тира
function TierRow({ tier, champions }) {
  if (!champions || champions.length === 0) return null;

  const color = tierColor(tier);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 4,
        marginBottom: 10,
        alignItems: "flex-start",
        padding: "10px",
      }}
    >
      {/* колонка с обозначением тира */}
      <div
        style={{
          minWidth: 52,
          padding: "6px 8px",
          borderRadius: 10,
          background: "rgba(15,23,42,0.96)",
          border: `1px solid ${color}`,
          color,
          fontWeight: 700,
          fontSize: 14,
          textAlign: "center",
        }}
      >
        {tier}
      </div>

      {/* чемпионы этого тира */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {champions.map((c) => (
          <TierChampionCard key={c.slug} champ={c} />
        ))}
      </div>
    </div>
  );
}

export default function TierlistScreen({ language = "ru_ru", onBack }) {
  const [rankKey, setRankKey] = useState("diamondPlus");
  const [laneKey, setLaneKey] = useState("top");

  const [tiersOrder, setTiersOrder] = useState(["S+", "S", "A", "B", "C", "D"]);
  const [tiers, setTiers] = useState({
    "S+": [],
    S: [],
    A: [],
    B: [],
    C: [],
    D: [],
  });
  const [date, setDate] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // подгружаем тирлист при изменении rank/lane/lang
  useEffect(() => {
    let cancelled = false;

    async function loadTierlist() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          rank: rankKey,
          lane: laneKey,
          lang: language,
        });

        const res = await fetch(
          `${API_BASE}/api/tierlist?${params.toString()}`
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        if (cancelled) return;

        setTiersOrder(Array.isArray(json.tiersOrder) ? json.tiersOrder : []);
        setTiers(json.tiers || {});
        setDate(json.filters?.date || null);
      } catch (e) {
        console.error("Ошибка загрузки /api/tierlist", e);
        if (!cancelled) {
          setError("Не удалось загрузить тир-лист.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTierlist();

    return () => {
      cancelled = true;
    };
  }, [rankKey, laneKey, language]);

  const filters = (
    <>
      <RankFilter value={rankKey} onChange={setRankKey} />
      <LaneFilter value={laneKey} onChange={setLaneKey} />
    </>
  );

  const hasAny =
    tiersOrder &&
    tiersOrder.some((t) => Array.isArray(tiers[t]) && tiers[t].length > 0);

  return (
    <PageWrapper
      onBack={onBack}
      filters={filters}
      loading={loading}
      error={!loading ? error : null}
      loadingText="Считаю тир-лист…"
      wrapInCard
    >
      {/* заголовок / дата */}
      <div
        style={{
          marginBottom: 10,
          padding: "4px 6px 8px",
          borderBottom: "1px solid rgba(31,41,55,1)",
          fontSize: 12,
          opacity: 0.9,
        }}
      >
        <div
          style={{
            marginBottom: 2,
            fontSize: 13,
            fontWeight: 600,
            padding: "10px",
          }}
        >
          Тир-лист чемпионов
        </div>
        <div style={{ opacity: 0.8, padding: "10px" }}>
          Основан на strength level за{" "}
          {date ? date : "последний доступный день"} для выбранного ранга и
          линии.
        </div>
      </div>

      {/* сами тиры */}
      {hasAny ? (
        tiersOrder.map((tierKey) => (
          <TierRow
            key={tierKey}
            tier={tierKey}
            champions={tiers[tierKey] || []}
          />
        ))
      ) : !loading ? (
        <div
          style={{
            padding: "10px 8px",
            fontSize: 13,
            opacity: 0.7,
          }}
        >
          Для выбранных фильтров тир-лист пуст.
        </div>
      ) : null}
    </PageWrapper>
  );
}
