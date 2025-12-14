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
    <div className="tl-champCard">
      <div className="tl-champIconWrap">
        {champ.icon && (
          <img src={champ.icon} alt={champ.name} className="tl-champIcon" />
        )}
      </div>

      <div className="tl-champName" title={champ.name}>
        {champ.name}
      </div>

      <div className="tl-champWr">
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
    <div className="tl-tierRow">
      {/* колонка с обозначением тира */}
      <div
        className="tl-tierBadge"
        style={{
          border: `1px solid ${color}`,
          color,
        }}
      >
        {tier}
      </div>

      {/* чемпионы этого тира */}
      <div className="tl-tierChamps">
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
      {/* CSS с media queries (мобилка ок, десктоп — крупнее и не растянуто) */}
      <style>{`
        .tl-wrap {
          width: 100%;
          margin: 0 auto;
          max-width: 720px;   /* мобилка/планшет: компактно */
        }

        /* заголовок/дата */
        .tl-header {
          margin-bottom: 10px;
          padding: 4px 6px 8px;
          border-bottom: 1px solid rgba(31,41,55,1);
          font-size: 12px;
          opacity: 0.9;
        }
        .tl-title {
          margin-bottom: 2px;
          font-size: 13px;
          font-weight: 600;
          padding: 10px;
        }
        .tl-subtitle {
          opacity: 0.8;
          padding: 10px;
        }

        /* ряд тира */
        .tl-tierRow {
          display: flex;
          flex-direction: row;
          gap: 4px;
          margin-bottom: 10px;
          align-items: flex-start;
          padding: 10px;
        }
        .tl-tierBadge {
          min-width: 52px;
          padding: 6px 8px;
          border-radius: 10px;
          background: rgba(15,23,42,0.96);
          font-weight: 700;
          font-size: 14px;
          text-align: center;
        }
        .tl-tierChamps {
          flex: 1;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        /* карточка чемпиона */
        .tl-champCard {
          width: 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 4px;
          border-radius: 10px;
          background: rgba(15,23,42,0.9);
          border: 1px solid rgba(30,64,175,0.4);
        }
        .tl-champIconWrap {
          width: 56px;
          height: 56px;
          border-radius: 8px;
          overflow: hidden;
          background: rgba(15,23,42,0.95);
          border: 1px solid rgba(51,65,85,0.95);
        }
        .tl-champIcon {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .tl-champName {
          font-size: 10px;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
        }
        .tl-champWr {
          font-size: 9px;
          opacity: 0.75;
          text-align: center;
        }

        /* DESKTOP: не растягиваем на всю ширину и увеличиваем элементы */
        @media (min-width: 900px) {
          .tl-wrap {
            max-width: 1040px;  /* центрируем контент, убираем “километровые” ряды */
          }

          .tl-header {
            font-size: 14px;
          }
          .tl-title {
            font-size: 18px;
          }
          .tl-subtitle {
            font-size: 14px;
          }

          .tl-tierRow {
            gap: 10px;
            padding: 14px 12px;
            margin-bottom: 14px;
          }
          .tl-tierBadge {
            min-width: 76px;
            font-size: 18px;
            padding: 10px 10px;
            border-radius: 12px;
          }
          .tl-tierChamps {
            gap: 12px;
          }

          .tl-champCard {
            width: 112px;
            gap: 6px;
            padding: 8px;
            border-radius: 12px;
          }
          .tl-champIconWrap {
            width: 78px;
            height: 78px;
            border-radius: 10px;
          }
          .tl-champName {
            font-size: 13px;
          }
          .tl-champWr {
            font-size: 12px;
          }
        }

        /* WIDE DESKTOP: ещё чуть шире, но всё равно ограничено */
        @media (min-width: 1280px) {
          .tl-wrap {
            max-width: 1180px;
          }
        }
      `}</style>

      <div className="tl-wrap">
        {/* заголовок / дата */}
        <div className="tl-header">
          <div className="tl-title">Тир-лист чемпионов</div>
          <div className="tl-subtitle">
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
      </div>
    </PageWrapper>
  );
}
