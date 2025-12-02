// ui/src/screens/TopPicksBansScreen.jsx
import { useEffect, useMemo, useState } from "react";
import PageWrapper from "../components/PageWrapper.jsx";
import { RANK_OPTIONS, LANE_OPTIONS } from "./constants";

// мапы для читабельных названий
const RANK_LABELS = Object.fromEntries(
  (RANK_OPTIONS || []).map((opt) => [opt.value, opt.label])
);

const LANE_LABELS = Object.fromEntries(
  (LANE_OPTIONS || []).map((opt) => [opt.value, opt.label])
);

const RANK_ORDER = (RANK_OPTIONS || []).map((opt) => opt.value);

// аватарка чемпиона (чуть крупнее и в рамке)
function ChampAvatarCard({ name, src }) {
  return (
    <div
      style={{
        width: 40,
        height: 44,
        borderRadius: 8,
        overflow: "hidden",
        background: "rgba(15, 23, 42, 0.9)",
        border: "1px solid rgba(51,65,85,0.9)",
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

// отдельная карточка топ-чемпиона
function TopChampCard({ index, champ, type, imgUrl }) {
  const [hover, setHover] = useState(false);

  const totalValue =
    type === "pick" ? champ.totalPickRate || 0 : champ.totalBanRate || 0;

  const titleMetric =
    type === "pick" ? "Совокупный пикрейт" : "Совокупный банрейт";

  const laneEntries = useMemo(() => {
    const lanes = champ.lanes || {};
    const arr = Object.entries(lanes).filter(([, laneData]) => {
      if (!laneData) return false;
      const val = type === "pick" ? laneData.pick || 0 : laneData.ban || 0;
      return val > 0;
    });

    return arr
      .sort(([, a], [, b]) => {
        const av = type === "pick" ? a.pick || 0 : a.ban || 0;
        const bv = type === "pick" ? b.pick || 0 : b.ban || 0;
        return bv - av;
      })
      .slice(0, 3);
  }, [champ, type]);

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
      }}
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

      <div
        style={{ position: "relative" }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <ChampAvatarCard name={champ.name} src={imgUrl} />
      </div>

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
          ({champ.slug}) — {titleMetric.toLowerCase()}:{" "}
          <span style={{ fontWeight: 600 }}>{totalValue.toFixed(2)}%</span>
        </div>
        <div style={{ fontSize: 11, opacity: 0.85 }}>
          Основные роли:&nbsp;
          {laneEntries.length ? (
            laneEntries
              .map(([laneKey, laneData]) => {
                const laneLabel = LANE_LABELS[laneKey] || laneKey || "роль";
                const val =
                  type === "pick" ? laneData.pick || 0 : laneData.ban || 0;
                return `${laneLabel}: ${val.toFixed(2)}%`;
              })
              .join(" · ")
          ) : (
            <>нет данных</>
          )}
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

      {/* тултип по наведению на картинку */}
      {hover && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(15,23,42,0.97)",
            padding: 10,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            fontSize: 11,
            lineHeight: 1.4,
          }}
        >
          <div
            style={{
              fontWeight: 700,
              marginBottom: 4,
              fontSize: 12,
            }}
          >
            {champ.name.toUpperCase()} ({champ.slug})
          </div>
          <div style={{ marginBottom: 6 }}>
            {titleMetric}:{" "}
            <span style={{ fontWeight: 700 }}>{totalValue.toFixed(2)}%</span>
          </div>

          {laneEntries.map(([laneKey, laneData]) => {
            const laneLabel = LANE_LABELS[laneKey] || laneKey || "роль";
            const laneTotal =
              type === "pick" ? laneData.pick || 0 : laneData.ban || 0;
            const ranks =
              type === "pick"
                ? laneData.pickRanks || {}
                : laneData.banRanks || {};

            const rankEntries = Object.entries(ranks).sort(
              ([rkA, aVal], [rkB, bVal]) => {
                const orderA = RANK_ORDER.indexOf(rkA);
                const orderB = RANK_ORDER.indexOf(rkB);
                if (orderA !== -1 && orderB !== -1 && orderA !== orderB) {
                  return orderA - orderB;
                }
                return (bVal || 0) - (aVal || 0);
              }
            );

            const ranksStr = rankEntries
              .map(([rk, v]) => {
                const label = RANK_LABELS[rk] || rk;
                return `${label}: ${v.toFixed(2)}%`;
              })
              .join(", ");

            return (
              <div key={laneKey} style={{ marginBottom: 4 }}>
                {laneLabel}:{" "}
                <span style={{ fontWeight: 600 }}>{laneTotal.toFixed(2)}%</span>
                {ranksStr && <> (по рангам: {ranksStr})</>}
              </div>
            );
          })}

          {!laneEntries.length && <div>Подробной статистики по ролям нет.</div>}
        </div>
      )}
    </div>
  );
}

function TopPicksBansScreen({ language = "ru_ru", onBack }) {
  const [data, setData] = useState(null);
  const [champImages, setChampImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        if (!cancelled) {
          setError("Не удалось загрузить статистику пиков и банов.");
        }
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

  // агрегируем статистику по всем рангам и линиям
  const aggregated = useMemo(() => {
    if (!data || !Array.isArray(data.combined)) return [];

    return data.combined
      .map((champ) => {
        const cnStats = champ.cnStats || {};
        let totalPick = 0;
        let totalBan = 0;
        const lanes = {};

        for (const [rankKey, lanesObj] of Object.entries(cnStats)) {
          if (!lanesObj) continue;

          for (const [laneKey, cell] of Object.entries(lanesObj)) {
            if (!cell) continue;

            const pickRate = cell.pickRate ?? 0;
            const banRate = cell.banRate ?? 0;

            totalPick += pickRate;
            totalBan += banRate;

            if (!lanes[laneKey]) {
              lanes[laneKey] = {
                pick: 0,
                ban: 0,
                pickRanks: {},
                banRanks: {},
              };
            }

            lanes[laneKey].pick += pickRate;
            lanes[laneKey].ban += banRate;
            lanes[laneKey].pickRanks[rankKey] =
              (lanes[laneKey].pickRanks[rankKey] || 0) + pickRate;
            lanes[laneKey].banRanks[rankKey] =
              (lanes[laneKey].banRanks[rankKey] || 0) + banRate;
          }
        }

        if (totalPick === 0 && totalBan === 0) return null;

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
          totalPickRate: totalPick,
          totalBanRate: totalBan,
          lanes,
        };
      })
      .filter(Boolean);
  }, [data, language]);

  const topPicks = useMemo(() => {
    return [...aggregated]
      .sort((a, b) => (b.totalPickRate || 0) - (a.totalPickRate || 0))
      .slice(0, 5);
  }, [aggregated]);

  const topBans = useMemo(() => {
    return [...aggregated]
      .sort((a, b) => (b.totalBanRate || 0) - (a.totalBanRate || 0))
      .slice(0, 5);
  }, [aggregated]);

  return (
    <PageWrapper
      onBack={onBack}
      filters={null}
      loading={loading}
      error={!loading ? error : null}
      loadingText="Считаю пики и баны…"
      wrapInCard
    >
      <div
        style={{
          marginBottom: 10,
          fontSize: 13,
          opacity: 0.85,
        }}
      >
        Ниже — топ-5 чемпионов по суммарному пикрейту и банрейту во всех рангах
        и на всех линиях. Наведи на картинку чемпиона, чтобы увидеть подробную
        раскладку по ролям и рангам.
      </div>

      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          Топ-5 по пикам
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
          Топ-5 по банам
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
    </PageWrapper>
  );
}

export default TopPicksBansScreen;
