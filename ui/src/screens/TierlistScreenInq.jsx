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
  if (score >= 15) return "S+";
  if (score >= 12) return "S";
  if (score >= 10) return "A";
  if (score >= 7) return "B";
  if (score >= 3) return "C";
  if (score >= 1) return "D";
  return null;
}

/* -------------------- UI helpers -------------------- */

function WeightSlider({ label, value, onChange }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div
        style={{ display: "flex", justifyContent: "space-between", gap: 10 }}
      >
        <div style={{ opacity: 0.9 }}>{label}</div>
        <div style={{ fontWeight: 800 }}>{Number(value).toFixed(1)}×</div>
      </div>

      <input
        type="range"
        min={0}
        max={3}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

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

function CalcRowWeighted({ label, value, pts, weight }) {
  const safePts = pts ?? 0;
  const safeW = weight ?? 0;

  const weighted = safePts * safeW;
  const weightedRounded = Math.round(weighted * 10) / 10;

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

        <div style={{ opacity: 0.85 }}>
          {safePts} очк. × {Number(safeW).toFixed(1)} ={" "}
          <span style={{ fontWeight: 800 }}>{weightedRounded}</span>
        </div>
      </div>
    </div>
  );
}

/* -------------------- Screen -------------------- */

export default function TierlistScreenInq({ language = "ru_ru", onBack }) {
  const [rankKey, setRankKey] = useState("diamondPlus");
  const [laneKey, setLaneKey] = useState("top");

  // веса (ползунки)
  const [wWin, setWWin] = useState(1);
  const [wPick, setWPick] = useState(1);
  const [wBan, setWBan] = useState(1);

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
        console.error("Ошибка загрузки данных для TierlistScreenInq", e);
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

      const totalScoreRaw = winPts * wWin + pickPts * wPick + banPts * wBan;
      const totalScore = Math.round(totalScoreRaw * 10) / 10;

      const tier = scoreToTier(totalScore);
      if (!tier) continue;

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

        wWin,
        wPick,
        wBan,

        totalScoreRaw,
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
  }, [champions, latestStats, rankKey, laneKey, wWin, wPick, wBan]);

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

        <div
          style={{
            marginTop: 12,
            marginBottom: 12,
            padding: 12,
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.03)",
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ fontWeight: 800, opacity: 0.9 }}>
            Настройки расчёта (веса)
          </div>

          <WeightSlider label="Вес винрейта" value={wWin} onChange={setWWin} />
          <WeightSlider
            label="Вес пикрейта"
            value={wPick}
            onChange={setWPick}
          />
          <WeightSlider label="Вес банрейта" value={wBan} onChange={setWBan} />
        </div>

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
                width: "min(640px, 100%)",
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
                    <b>{Number(selected.totalScore).toFixed(1)}</b> очков
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
                <CalcRowWeighted
                  label="Винрейт"
                  value={selected.winRate}
                  pts={selected.winPts}
                  weight={selected.wWin}
                />
                <CalcRowWeighted
                  label="Пикрейт"
                  value={selected.pickRate}
                  pts={selected.pickPts}
                  weight={selected.wPick}
                />
                <CalcRowWeighted
                  label="Банрейт"
                  value={selected.banRate}
                  pts={selected.banPts}
                  weight={selected.wBan}
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
                  <div>{Number(selected.totalScore).toFixed(1)} очков</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </TlWrap>
    </PageWrapper>
  );
}
