// ui/src/screens/TopPicksBansScreen.jsx
import { useEffect, useMemo, useState } from "react";
import PageWrapper from "../components/PageWrapper.jsx";

// порядок рангов и их русские названия
const RANK_KEYS = ["diamondPlus", "masterPlus", "peak", "king"];
const RANK_LABELS_RU = {
  diamondPlus: "алмаз",
  masterPlus: "мастер",
  peak: "гм",
  king: "чалик",
};

const EXCLUDED_RANK_KEYS = new Set(["overall"]);

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

// карточка топ-чемпиона (только краткая инфа + клик)
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
  const laneEntries = Object.entries(lanes).sort(([, a], [, b]) => {
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

          return (
            <div key={laneKey} style={{ marginBottom: 4 }}>
              - {laneKey}: {laneTotal.toFixed(2)}%
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
  const [data, setData] = useState(null);
  const [champImages, setChampImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState(null); // что показываем в модалке

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

  // агрегируем статистику по всем линиям и рангам ЗА ПОСЛЕДНИЙ ДЕНЬ
  const aggregated = useMemo(() => {
    if (!data || !Array.isArray(data.combined)) return [];

    return data.combined
      .map((champ) => {
        // берём cnStats из последнего элемента history, если он есть
        let cnStats = champ.cnStats || {};

        if (Array.isArray(champ.history) && champ.history.length > 0) {
          let latest = champ.history[0];
          for (const item of champ.history) {
            if (item.date && (!latest.date || item.date > latest.date)) {
              latest = item;
            }
          }
          if (latest && latest.cnStats) {
            cnStats = latest.cnStats;
          }
        }

        let totalPick = 0;
        let totalBan = 0;
        const lanes = {};

        for (const [rankKey, lanesObj] of Object.entries(cnStats || {})) {
          if (!lanesObj) continue;
          if (EXCLUDED_RANK_KEYS.has(rankKey)) continue;

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

  const topPicks = useMemo(
    () =>
      [...aggregated]
        .sort((a, b) => (b.totalPickRate || 0) - (a.totalPickRate || 0))
        .slice(0, 5),
    [aggregated]
  );

  const topBans = useMemo(
    () =>
      [...aggregated]
        .sort((a, b) => (b.totalBanRate || 0) - (a.totalBanRate || 0))
        .slice(0, 5),
    [aggregated]
  );

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
        Ниже — топ-5 чемпионов по суммарному пикрейту и банрейтy за последний
        день во всех рангах и на всех линиях. Нажми на карточку чемпиона, чтобы
        увидеть подробную раскладку по ролям и рангам.
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
