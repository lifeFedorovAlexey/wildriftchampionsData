import { useEffect, useMemo, useState } from "react";
import PageWrapper from "../components/PageWrapper.jsx";
import { RankFilter } from "../components/RankFilter.jsx";
import { LaneFilter } from "../components/LaneFilter.jsx";

import {
  TlWrap,
  TlHeader,
  TlTitle,
  TlSubtitle,
  TlTierRow,
  TlTierBadge,
  TlTierChamps,
  TlChampCard,
  TlChampIcon,
  TlEmpty,
} from "../components/styled";

import { tierColor, tierBg } from "../components/styled";

const API_BASE = "https://wr-api-pjtu.vercel.app";

/* -------------------- RULES: points -------------------- */

function pointsWinrate(v) {
  if (v == null) return 0;
  if (v >= 55) return 6;
  if (v >= 53 && v < 55) return 5;
  if (v >= 51 && v < 53) return 4;
  if (v >= 50 && v < 51) return 3;
  if (v >= 49 && v < 50) return 2;
  if (v >= 48 && v < 49) return 1;
  return 0;
}

function pointsBanrate(v) {
  if (v == null) return 0;
  if (v >= 50) return 6;
  if (v >= 30 && v < 50) return 5;
  if (v >= 20 && v < 30) return 4;
  if (v >= 10 && v < 20) return 3;
  if (v >= 5 && v < 10) return 2;
  if (v >= 2 && v < 5) return 1;
  return 0;
}

function pointsPickrate(v) {
  if (v == null) return 0;
  if (v >= 20) return 6;
  if (v >= 15 && v < 20) return 5;
  if (v >= 10 && v < 15) return 4;
  if (v >= 5 && v < 10) return 3;
  if (v >= 3 && v < 5) return 2;
  if (v >= 1 && v < 3) return 1;
  return 0;
}

function scoreToTier(score) {
  // S+ - 15+; S - 12-15; A - 10-12; B - 7-10; C - 3-7; D - 1-3.
  // “стыкуем” без дыр:
  // 15+ => S+
  // 12..14 => S
  // 10..11 => A
  // 7..9 => B
  // 3..6 => C
  // 1..2 => D
  // 0 => null (не показываем)
  if (score >= 15) return "S+";
  if (score >= 12) return "S";
  if (score >= 10) return "A";
  if (score >= 7) return "B";
  if (score >= 3) return "C";
  if (score >= 1) return "D";
  return null;
}

/* -------------------- UI -------------------- */

function TierChampionIcon({ champ, onClick }) {
  return (
    <TlChampCard
      title={`${champ.name} • ${champ.totalScore} очк.`}
      onClick={() => onClick?.(champ)}
      style={{ cursor: "pointer" }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.(champ);
      }}
    >
      {champ.icon ? <TlChampIcon src={champ.icon} alt={champ.name} /> : null}
    </TlChampCard>
  );
}

function TierRow({ tier, champions, onChampionClick }) {
  if (!champions || champions.length === 0) return null;

  const borderColor = tierColor(tier);

  return (
    <TlTierRow>
      <TlTierBadge $bg={tierBg(tier)} style={{ borderColor }}>
        {tier}
      </TlTierBadge>

      <TlTierChamps>
        {champions.map((c) => (
          <TierChampionIcon key={c.slug} champ={c} onClick={onChampionClick} />
        ))}
      </TlTierChamps>
    </TlTierRow>
  );
}

function CalcRow({ label, value, pts }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: 10,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div style={{ opacity: 0.9 }}>{label}</div>
      <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
        <div style={{ opacity: 0.85 }}>
          {value != null ? `${Number(value).toFixed(2)}%` : "—"}
        </div>
        <div style={{ fontWeight: 800 }}>{pts} очк.</div>
      </div>
    </div>
  );
}

/* -------------------- Screen -------------------- */

export default function TierlistScreenInq({ language = "ru_ru", onBack }) {
  const [rankKey, setRankKey] = useState("diamondPlus");
  const [laneKey, setLaneKey] = useState("top");

  const tiersOrder = useMemo(() => ["S+", "S", "A", "B", "C", "D"], []);

  const [champions, setChampions] = useState([]);
  const [latestStats, setLatestStats] = useState(null);
  const [date, setDate] = useState(null);

  const [selected, setSelected] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [champRes, histRes] = await Promise.all([
          fetch(
            `${API_BASE}/api/champions?lang=${encodeURIComponent(language)}`
          ),
          fetch(`${API_BASE}/api/champion-history`),
        ]);

        if (!champRes.ok) throw new Error(`Champions HTTP ${champRes.status}`);
        if (!histRes.ok) throw new Error(`History HTTP ${histRes.status}`);

        const champsJson = await champRes.json();
        const histJson = await histRes.json();
        if (cancelled) return;

        setChampions(Array.isArray(champsJson) ? champsJson : []);

        const items = Array.isArray(histJson.items) ? histJson.items : [];
        const latestMap = {};

        for (const item of items) {
          if (!item || !item.slug || !item.rank || !item.lane || !item.date)
            continue;

          const key = `${item.slug}|${item.rank}|${item.lane}`;
          const prev = latestMap[key];

          if (!prev) latestMap[key] = item;
          else if (String(item.date) > String(prev.date)) latestMap[key] = item;
        }

        setLatestStats(latestMap);
      } catch (e) {
        console.error("Ошибка загрузки данных для TierlistScreen", e);
        if (!cancelled) setError("Не удалось загрузить тир-лист.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [language]);

  const tiers = useMemo(() => {
    const out = { "S+": [], S: [], A: [], B: [], C: [], D: [] };
    if (!champions.length || !latestStats) return out;

    let maxDate = null;

    for (const champ of champions) {
      const slug = champ?.slug;
      if (!slug) continue;

      const key = `${slug}|${rankKey}|${laneKey}`;
      const stat = latestStats[key];
      if (!stat) continue;

      const name =
        typeof champ.name === "string" && champ.name.trim() ? champ.name : slug;

      const winRate = stat.winRate ?? null;
      const pickRate = stat.pickRate ?? null;
      const banRate = stat.banRate ?? null;

      const winPts = pointsWinrate(winRate);
      const pickPts = pointsPickrate(pickRate);
      const banPts = pointsBanrate(banRate);

      const totalScore = winPts + pickPts + banPts;

      const tier = scoreToTier(totalScore);
      if (!tier) continue; // 0 очков — не показываем

      if (stat.date != null) {
        const d = String(stat.date);
        if (!maxDate || d > maxDate) maxDate = d;
      }

      out[tier].push({
        slug,
        name,
        icon: champ.icon || null,

        winRate,
        pickRate,
        banRate,

        winPts,
        pickPts,
        banPts,
        totalScore,

        computedTier: tier,
      });
    }

    for (const t of Object.keys(out)) {
      out[t].sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        const bw = b.winRate ?? -999;
        const aw = a.winRate ?? -999;
        if (bw !== aw) return bw - aw;
        const bp = b.pickRate ?? -999;
        const ap = a.pickRate ?? -999;
        return bp - ap;
      });
    }

    setDate(maxDate);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [champions, latestStats, rankKey, laneKey]);

  const hasAny =
    tiersOrder &&
    tiersOrder.some((t) => Array.isArray(tiers[t]) && tiers[t].length > 0);

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
      loadingText="Считаю тир-лист…"
      wrapInCard
    >
      <TlWrap>
        <TlHeader>
          <TlTitle>Тир-лист чемпионов</TlTitle>
          <TlSubtitle>
            Считается по WR/PR/BR за {date ? date : "последний доступный день"}{" "}
            для выбранного ранга и линии. Клик по чемпиону — покажу расчёт.
          </TlSubtitle>
        </TlHeader>

        {hasAny ? (
          tiersOrder.map((tierKey) => (
            <TierRow
              key={tierKey}
              tier={tierKey}
              champions={tiers[tierKey] || []}
              onChampionClick={(c) => setSelected(c)}
            />
          ))
        ) : !loading ? (
          <TlEmpty>Для выбранных фильтров тир-лист пуст.</TlEmpty>
        ) : null}

        {/* модалка с расчётом */}
        {selected && (
          <div
            onClick={() => setSelected(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              zIndex: 9999,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(560px, 100%)",
                background: "#0b1220",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 16,
                padding: 16,
                boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    overflow: "hidden",
                  }}
                >
                  {selected.icon ? (
                    <img
                      src={selected.icon}
                      alt={selected.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : null}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>
                    {selected.name}
                  </div>
                  <div style={{ opacity: 0.8, marginTop: 2 }}>
                    Итог: <b>{selected.computedTier}</b> •{" "}
                    <b>{selected.totalScore}</b> очков
                  </div>
                </div>

                <button
                  onClick={() => setSelected(null)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "white",
                    borderRadius: 10,
                    padding: "8px 10px",
                    cursor: "pointer",
                  }}
                >
                  Закрыть
                </button>
              </div>

              <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                <CalcRow
                  label="Винрейт"
                  value={selected.winRate}
                  pts={selected.winPts}
                />
                <CalcRow
                  label="Пикрейт"
                  value={selected.pickRate}
                  pts={selected.pickPts}
                />
                <CalcRow
                  label="Банрейт"
                  value={selected.banRate}
                  pts={selected.banPts}
                />

                <div
                  style={{
                    marginTop: 6,
                    paddingTop: 10,
                    borderTop: "1px solid rgba(255,255,255,0.10)",
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 800,
                  }}
                >
                  <div>Сумма</div>
                  <div>{selected.totalScore} очков</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </TlWrap>
    </PageWrapper>
  );
}
