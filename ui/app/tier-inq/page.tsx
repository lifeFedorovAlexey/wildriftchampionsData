"use client";

import { useEffect, useMemo, useState } from "react";
import PageWrapper from "@/components/PageWrapper";
import RankFilter from "@/components/RankFilter";
import LaneFilter from "@/components/LaneFilter";
import StreamerSocials from "@/components/StreamerSocials";

import LoadingRing from "@/components/LoadingRing";
import { API_BASE } from "@/constants/apiBase";
import {
  TlWeightSliderWrap,
  TlWeightSliderTop,
  TlWeightSliderLabel,
  TlWeightSliderValue,
  TlRange,
  TlChampCard,
  TlChampIcon,
  tierColor,
  TlTierRow,
  TlTierBadge,
  tierBg,
  TlTierChamps,
  TlCalcRow,
  TlCalcLabel,
  TlCalcRight,
  TlCalcMuted,
  TlCalcStrong,
  TlWrap,
  TlHeader,
  TlTitle,
  TlSubtitle,
  TlWeightsBox,
  TlWeightsTitle,
  TlEmpty,
  TlModalOverlay,
  TlModalCard,
  TlModalTop,
  TlModalIconWrap,
  TlModalIcon,
  TlModalMeta,
  TlModalName,
  TlModalResult,
  TlModalCloseBtn,
  TlCalcList,
  TlCalcSumRow,
} from "@/components/styled/tierlistInq";

/* -------------------- RULES: points -------------------- */

function pointsWinrate(v: number | null) {
  if (v == null) return 0;
  if (v >= 55) return 6;
  if (v >= 53 && v < 55) return 5;
  if (v >= 51 && v < 53) return 4;
  if (v >= 50 && v < 51) return 3;
  if (v >= 49 && v < 50) return 2;
  if (v >= 48 && v < 49) return 1;
  return 0;
}

function pointsBanrate(v: number | null) {
  if (v == null) return 0;
  if (v >= 50) return 6;
  if (v >= 30 && v < 50) return 5;
  if (v >= 20 && v < 30) return 4;
  if (v >= 10 && v < 20) return 3;
  if (v >= 5 && v < 10) return 2;
  if (v >= 2 && v < 5) return 1;
  return 0;
}

function pointsPickrate(v: number | null) {
  if (v == null) return 0;
  if (v >= 20) return 6;
  if (v >= 15 && v < 20) return 5;
  if (v >= 10 && v < 15) return 4;
  if (v >= 5 && v < 10) return 3;
  if (v >= 3 && v < 5) return 2;
  if (v >= 1 && v < 3) return 1;
  return 0;
}

function scoreToTier(score: number) {
  if (score >= 15) return "S+";
  if (score >= 12) return "S";
  if (score >= 10) return "A";
  if (score >= 7) return "B";
  if (score >= 3) return "C";
  if (score >= 1) return "D";
  return null;
}

/* -------------------- UI helpers -------------------- */

function WeightSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <TlWeightSliderWrap>
      <TlWeightSliderTop>
        <TlWeightSliderLabel>{label}</TlWeightSliderLabel>
        <TlWeightSliderValue>{Number(value).toFixed(1)}×</TlWeightSliderValue>
      </TlWeightSliderTop>

      <TlRange
        type="range"
        min={0}
        max={3}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </TlWeightSliderWrap>
  );
}

type TierChamp = {
  slug: string;
  name: string;
  icon: string | null;

  winRate: number | null;
  pickRate: number | null;
  banRate: number | null;

  winPts: number;
  pickPts: number;
  banPts: number;

  wWin: number;
  wPick: number;
  wBan: number;

  totalScoreRaw: number;
  totalScore: number;

  computedTier: string;
};

function TierChampionIcon({
  champ,
  onClick,
}: {
  champ: TierChamp;
  onClick?: (c: TierChamp) => void;
}) {
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

function TierRow({
  tier,
  champions,
  onChampionClick,
}: {
  tier: string;
  champions: TierChamp[];
  onChampionClick: (c: TierChamp) => void;
}) {
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

function CalcRowWeighted({
  label,
  value,
  pts,
  weight,
}: {
  label: string;
  value: number | null;
  pts: number | null;
  weight: number | null;
}) {
  const safePts = pts ?? 0;
  const safeW = weight ?? 0;

  const weighted = safePts * safeW;
  const weightedRounded = Math.round(weighted * 10) / 10;

  return (
    <TlCalcRow>
      <TlCalcLabel>{label}</TlCalcLabel>

      <TlCalcRight>
        <TlCalcMuted>
          {value != null ? `${Number(value).toFixed(2)}%` : "—"}
        </TlCalcMuted>

        <TlCalcMuted>
          {safePts} очк. × {Number(safeW).toFixed(1)} ={" "}
          <TlCalcStrong>{weightedRounded}</TlCalcStrong>
        </TlCalcMuted>
      </TlCalcRight>
    </TlCalcRow>
  );
}

/* -------------------- Screen -------------------- */

export default function TierlistInqPage() {
  const language = "ru_ru";

  const [rankKey, setRankKey] = useState("diamondPlus");
  const [laneKey, setLaneKey] = useState("top");

  const [wWin, setWWin] = useState(1);
  const [wPick, setWPick] = useState(1);
  const [wBan, setWBan] = useState(1);

  const tiersOrder = useMemo(() => ["S+", "S", "A", "B", "C", "D"], []);

  const [champions, setChampions] = useState<any[]>([]);
  const [latestStats, setLatestStats] = useState<Record<string, any> | null>(
    null
  );
  const [date, setDate] = useState<string | null>(null);

  const [selected, setSelected] = useState<TierChamp | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          fetch(`${API_BASE}/api/champion-history?latest=1`),
        ]);

        if (!champRes.ok) throw new Error(`Champions HTTP ${champRes.status}`);
        if (!histRes.ok) throw new Error(`History HTTP ${histRes.status}`);

        const champsJson = await champRes.json();
        const histJson = await histRes.json();
        if (cancelled) return;

        setChampions(Array.isArray(champsJson) ? champsJson : []);

        const items = Array.isArray(histJson.items) ? histJson.items : [];
        const latestMap: Record<string, any> = {};

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
        console.error("Ошибка загрузки данных для TierlistInqPage", e);
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
    const out: Record<string, TierChamp[]> = {
      "S+": [],
      S: [],
      A: [],
      B: [],
      C: [],
      D: [],
    };
    if (!champions.length || !latestStats) return out;

    let maxDate: string | null = null;

    for (const champ of champions) {
      const slug = champ?.slug;
      if (!slug) continue;

      const key = `${slug}|${rankKey}|${laneKey}`;
      const stat = (latestStats as any)[key];
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
  }, [champions, latestStats, rankKey, laneKey, wWin, wPick, wBan]);

  const hasAny = tiersOrder.some(
    (t) => Array.isArray(tiers[t]) && tiers[t].length > 0
  );

  const filters = (
    <>
      <RankFilter value={rankKey} onChange={setRankKey} />
      <LaneFilter value={laneKey} onChange={setLaneKey} />
    </>
  );

  if (loading) return <LoadingRing label="Считаю тир-лист…" />;

  return (
    <PageWrapper
      showBack
      title="Тир-лист с настраеваемыми весами от INQ"
      paragraphs={[
        "Этот раздел позволяет получить тир-лист под конкретные условия: ранг, линия или фильтры.",
        "В алгоритмах расчета используется формула от INQ с возможностью настройки весов параметров.",
      ]}
    >
      {error ? (
        <div style={{ padding: 12, opacity: 0.9 }}>{error}</div>
      ) : (
        <TlWrap>
          {filters}

          <TlHeader>
            <TlTitle>Тир-лист чемпионов</TlTitle>
            <TlSubtitle>
              Считается по WR/PR/BR за{" "}
              {date ? date : "последний доступный день"} для выбранного ранга и
              линии. Клик по чемпиону — покажу расчёт.
            </TlSubtitle>
          </TlHeader>

          <TlWeightsBox>
            <TlWeightsTitle>Настройки расчёта (веса)</TlWeightsTitle>

            <WeightSlider
              label="Вес винрейта"
              value={wWin}
              onChange={setWWin}
            />
            <WeightSlider
              label="Вес пикрейта"
              value={wPick}
              onChange={setWPick}
            />
            <WeightSlider
              label="Вес банрейта"
              value={wBan}
              onChange={setWBan}
            />
          </TlWeightsBox>

          {hasAny ? (
            tiersOrder.map((tierKey) => (
              <TierRow
                key={tierKey}
                tier={tierKey}
                champions={tiers[tierKey] || []}
                onChampionClick={(c) => setSelected(c)}
              />
            ))
          ) : (
            <TlEmpty>Для выбранных фильтров тир-лист пуст.</TlEmpty>
          )}

          {selected ? (
            <TlModalOverlay onClick={() => setSelected(null)}>
              <TlModalCard onClick={(e) => e.stopPropagation()}>
                <TlModalTop>
                  <TlModalIconWrap>
                    {selected.icon ? (
                      <TlModalIcon src={selected.icon} alt={selected.name} />
                    ) : null}
                  </TlModalIconWrap>

                  <TlModalMeta>
                    <TlModalName>{selected.name}</TlModalName>
                    <TlModalResult>
                      Итог: <b>{selected.computedTier}</b> •{" "}
                      <b>{Number(selected.totalScore).toFixed(1)}</b> очков
                    </TlModalResult>
                  </TlModalMeta>

                  <TlModalCloseBtn onClick={() => setSelected(null)}>
                    Закрыть
                  </TlModalCloseBtn>
                </TlModalTop>

                <TlCalcList>
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

                  <TlCalcSumRow>
                    <div>Сумма</div>
                    <div>{Number(selected.totalScore).toFixed(1)} очков</div>
                  </TlCalcSumRow>
                </TlCalcList>
              </TlModalCard>
            </TlModalOverlay>
          ) : null}

          <StreamerSocials />
        </TlWrap>
      )}
    </PageWrapper>
  );
}
