"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import PageWrapper from "@/components/PageWrapper";
import ChampionAvatar from "@/components/ui/ChampionAvatar";
import {
  FiltersSkeleton,
  SocialsSkeleton,
} from "@/components/ui/LazySkeletons";

import LoadingRing from "@/components/LoadingRing";
import { API_BASE } from "@/constants/apiBase";
import { buildLatestStatsMap, buildTierBuckets } from "./tier-inq-lib";
import {
  TlWeightSliderWrap,
  TlWeightSliderTop,
  TlWeightSliderLabel,
  TlWeightSliderValue,
  TlRange,
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

const StatsFilters = dynamic(() => import("@/components/StatsFilters"), {
  loading: () => <FiltersSkeleton />,
});
const StreamerSocials = dynamic(() => import("@/components/StreamerSocials"), {
  loading: () => <SocialsSkeleton />,
});

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
    <ChampionAvatar
      name={champ.name}
      src={champ.icon}
      title={`${champ.name} • ${champ.totalScore} очк.`}
      mobileSize={44}
      desktopSize={54}
      mobileRadius={12}
      desktopRadius={14}
      onClick={() => onClick?.(champ)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(champ);
        }
      }}
    />
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

  const tiersOrder = useMemo(
    () => ["S+", "S", "A", "B", "C", "D"] as const,
    []
  );

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
          fetch(`${API_BASE}/api/latest-stats-snapshot`),
        ]);

        if (!champRes.ok) throw new Error(`Champions HTTP ${champRes.status}`);
        if (!histRes.ok) throw new Error(`History HTTP ${histRes.status}`);

        const champsJson = await champRes.json();
        const histJson = await histRes.json();
        if (cancelled) return;

        setChampions(Array.isArray(champsJson) ? champsJson : []);

        const items = Array.isArray(histJson.items) ? histJson.items : [];
        setLatestStats(buildLatestStatsMap(items));
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

  const { tiers, date: derivedDate } = useMemo(() => {
    return buildTierBuckets({
      champions,
      latestStats: latestStats ?? {},
      rankKey,
      laneKey,
      weights: { wWin, wPick, wBan },
    });
  }, [champions, latestStats, rankKey, laneKey, wWin, wPick, wBan]);

  useEffect(() => {
    setDate(derivedDate);
  }, [derivedDate]);

  const hasAny = tiersOrder.some((t) => tiers[t].length > 0);

  const filters = (
    <StatsFilters
      rankValue={rankKey}
      onRankChange={setRankKey}
      laneValue={laneKey}
      onLaneChange={setLaneKey}
    />
  );

  if (loading) return <LoadingRing label="Считаю тир-лист…" />;

  return (
    <PageWrapper
      title="Тир-лист с настраеваемыми весами от INQ"
      paragraphs={[
        "Этот раздел позволяет получить тир-лист под конкретные условия: ранг, линия или фильтры.",
        "В алгоритмах расчета используется формула от INQ с возможностью настройки весов параметров.",
      ]}
    >
      {error ? (
        <div style={{ padding: "var(--space-3)", opacity: 0.9 }}>{error}</div>
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
