import { useEffect, useState } from "react";
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
} from "../components/styled";
import { tierColor, tierBg } from "../components/styled";
const API_BASE = "https://wr-api-pjtu.vercel.app";

function TierChampionIcon({ champ }) {
  return (
    <TlChampCard
      title={`${champ.name}${
        champ.winRate != null ? ` • ${champ.winRate.toFixed(1)}%` : ""
      }`}
    >
      {champ.icon ? <TlChampIcon src={champ.icon} alt={champ.name} /> : null}
    </TlChampCard>
  );
}

function TierRow({ tier, champions }) {
  if (!champions || champions.length === 0) return null;

  const borderColor = tierColor(tier);

  return (
    <TlTierRow>
      <TlTierBadge $bg={tierBg(tier)} style={{ borderColor }}>
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
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        if (cancelled) return;

        setTiersOrder(Array.isArray(json.tiersOrder) ? json.tiersOrder : []);
        setTiers(json.tiers || {});
        setDate(json.filters?.date || null);
      } catch (e) {
        console.error("Ошибка загрузки /api/tierlist", e);
        if (!cancelled) setError("Не удалось загрузить тир-лист.");
      } finally {
        if (!cancelled) setLoading(false);
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
      <TlWrap>
        <TlHeader>
          <TlTitle>Тир-лист чемпионов</TlTitle>
          <TlSubtitle>
            Основан на strength level за{" "}
            {date ? date : "последний доступный день"} для выбранного ранга и
            линии.
          </TlSubtitle>
        </TlHeader>

        {hasAny ? (
          tiersOrder.map((tierKey) => (
            <TierRow
              key={tierKey}
              tier={tierKey}
              champions={tiers[tierKey] || []}
            />
          ))
        ) : !loading ? (
          <TlEmpty>Для выбранных фильтров тир-лист пуст.</TlEmpty>
        ) : null}
      </TlWrap>
    </PageWrapper>
  );
}
