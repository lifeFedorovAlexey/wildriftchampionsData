"use client";

import { useMemo, useState } from "react";

import PageWrapper from "@/components/PageWrapper";
import StatsFilters from "@/components/StatsFilters";
import {
  TlChampCard,
  TlChampIcon,
  tierColor,
  TlTierRow,
  TlTierBadge,
  tierBg,
  TlTierChamps,
  TlWrap,
  TlHeader,
  TlTitle,
  TlSubtitle,
  TlEmpty,
} from "@/components/styled/tierlist";
import { pickCurrentTiers } from "./tierlist-lib";

type RankKey = "diamondPlus" | "masterPlus" | "king" | "peak";
type LaneKey = "top" | "jungle" | "mid" | "adc" | "support";

type TierChampion = {
  slug: string;
  name: string;
  icon?: string | null;
  winRate?: number | null;
};

type TierBucket = {
  rank: RankKey;
  lane: LaneKey;
  tiers: Record<string, TierChampion[]>;
};

type BulkResponse = {
  filters: {
    date: string | null;
  };
  tiersOrder: string[];
  tiersByRankLane: Record<string, TierBucket>;
};

function TierChampionIcon({ champ }: { champ: TierChampion }) {
  const title = `${champ.name}${
    champ.winRate != null ? ` • ${champ.winRate.toFixed(1)}%` : ""
  }`;

  return (
    <TlChampCard title={title}>
      {champ.icon ? <TlChampIcon src={champ.icon} alt={champ.name} /> : null}
    </TlChampCard>
  );
}

function TierRow({
  tier,
  champions,
}: {
  tier: string;
  champions: TierChampion[];
}) {
  if (!champions.length) return null;

  return (
    <TlTierRow>
      <TlTierBadge $bg={tierBg(tier)} style={{ borderColor: tierColor(tier) }}>
        {tier}
      </TlTierBadge>

      <TlTierChamps>
        {champions.map((champion) => (
          <TierChampionIcon key={champion.slug} champ={champion} />
        ))}
      </TlTierChamps>
    </TlTierRow>
  );
}

export default function TierlistClient({
  data,
  error,
}: {
  data: BulkResponse | null;
  error: string | null;
}) {
  const [rankKey, setRankKey] = useState<RankKey>("diamondPlus");
  const [laneKey, setLaneKey] = useState<LaneKey>("top");

  const tiersOrder = data?.tiersOrder ?? ["S+", "S", "A", "B", "C", "D"];
  const date = data?.filters?.date ?? null;

  const currentTiers = useMemo(
    () => pickCurrentTiers(data, rankKey, laneKey),
    [data, rankKey, laneKey],
  );

  const hasAny =
    currentTiers &&
    tiersOrder.some((tierKey) => (currentTiers[tierKey] ?? []).length > 0);

  return (
    <PageWrapper
      showBack
      title="Автоматический тир-лист чемпионов Wild Rift"
      paragraphs={[
        "Тир-лист строится автоматически на основе статистических данных strength level.",
      ]}
    >
      {error ? (
        <div style={{ padding: 12, opacity: 0.9 }}>{error}</div>
      ) : (
        <TlWrap>
          <StatsFilters
            rankValue={rankKey}
            onRankChange={setRankKey}
            laneValue={laneKey}
            onLaneChange={setLaneKey}
          />

          <TlHeader>
            <TlTitle>Тир-лист чемпионов</TlTitle>
            <TlSubtitle>
              Основан на strength level за {date ?? "последний доступный день"} для
              выбранного ранга и линии.
            </TlSubtitle>
          </TlHeader>

          {hasAny && currentTiers ? (
            tiersOrder.map((tierKey) => (
              <TierRow
                key={tierKey}
                tier={tierKey}
                champions={currentTiers[tierKey] ?? []}
              />
            ))
          ) : (
            <TlEmpty>Для выбранных фильтров тир-лист пуст.</TlEmpty>
          )}
        </TlWrap>
      )}
    </PageWrapper>
  );
}
