"use client";

import { useEffect, useMemo, useState } from "react";

import PageWrapper from "@/components/PageWrapper";
import RankFilter from "@/components/RankFilter";
import LaneFilter from "@/components/LaneFilter";
import LoadingRing from "@/components/LoadingRing";

import { API_BASE } from "@/constants/apiBase";

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

/* ===================== types ===================== */

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

/* ===================== ui helpers ===================== */

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
        {champions.map((c) => (
          <TierChampionIcon key={c.slug} champ={c} />
        ))}
      </TlTierChamps>
    </TlTierRow>
  );
}

/* ===================== page ===================== */

export default function TierlistPage() {
  const language = "ru_ru";

  const [rankKey, setRankKey] = useState<RankKey>("diamondPlus");
  const [laneKey, setLaneKey] = useState<LaneKey>("top");

  const [data, setData] = useState<BulkResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------- load ONCE ---------- */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${API_BASE}/api/tierlist-bulk?lang=${language}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = (await res.json()) as BulkResponse;
        if (!cancelled) setData(json);
      } catch (e) {
        console.error("tierlist-bulk error", e);
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

  /* ---------- derived ---------- */
  const tiersOrder = data?.tiersOrder ?? ["S+", "S", "A", "B", "C", "D"];
  const date = data?.filters?.date ?? null;

  const currentTiers = useMemo(() => {
    if (!data) return null;
    return data.tiersByRankLane[`${rankKey}|${laneKey}`]?.tiers ?? null;
  }, [data, rankKey, laneKey]);

  const hasAny =
    currentTiers &&
    tiersOrder.some((t) => currentTiers[t] && currentTiers[t].length > 0);

  /* ---------- render ---------- */

  if (loading) return <LoadingRing label="Считаю тир-лист…" />;

  return (
    <PageWrapper showBack>
      {error ? (
        <div style={{ padding: 12, opacity: 0.9 }}>{error}</div>
      ) : (
        <TlWrap>
          {/* filters */}
          <RankFilter value={rankKey} onChange={setRankKey} />
          <LaneFilter value={laneKey} onChange={setLaneKey} />

          <TlHeader>
            <TlTitle>Тир-лист чемпионов</TlTitle>
            <TlSubtitle>
              Основан на strength level за {date ?? "последний доступный день"}{" "}
              для выбранного ранга и линии.
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
