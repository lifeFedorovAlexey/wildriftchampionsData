"use client";

import { useEffect, useMemo, useState } from "react";
import PageWrapper from "@/components/PageWrapper";
import LoadingRing from "@/components/LoadingRing";

import { API_BASE } from "@/constants/apiBase";
import {
  TpAvatar,
  TpAvatarImg,
  TpCard,
  TpCardIndex,
  TpCardInfo,
  TpCardName,
  TpCardSub,
  TpCardValue,
  TpModalOverlay,
  TpModal,
  TpModalTop,
  TpCloseBtn,
  TpLaneRow,
  TpHeader,
  TpHeaderText,
  TpRow,
  TpPillButton,
  TpSection,
  TpSectionTitle,
  TpCardWrap,
  TpEmpty,
} from "@/components/styled/topPicksBans";

const RANK_KEYS = ["diamondPlus", "masterPlus", "king", "peak"] as const;
const RANK_LABELS_RU: Record<string, string> = {
  diamondPlus: "Алмаз",
  masterPlus: "Мастер",
  king: "Грандмастер",
  peak: "Претендент",
};

const EXCLUDED_RANK_KEYS = new Set(["overall"]);
const LOW_ELO_RANKS = new Set(["diamondPlus", "masterPlus"]);
const HIGH_ELO_RANKS = new Set(["king", "peak"]);

function ChampAvatarCard({ name, src }: { name: string; src?: string | null }) {
  return (
    <TpAvatar>
      {src ? (
        <TpAvatarImg
          src={src}
          alt={name}
          decoding="async"
          width="64"
          height="64"
        />
      ) : null}
    </TpAvatar>
  );
}

function TopChampCard({
  index,
  champ,
  type,
  imgUrl,
  onClick,
}: {
  index: number;
  champ: any;
  type: "pick" | "ban";
  imgUrl?: string | null;
  onClick: () => void;
}) {
  const totalValue =
    type === "pick" ? champ.totalPickRate || 0 : champ.totalBanRate || 0;

  return (
    <TpCard $type={type} onClick={onClick}>
      <TpCardIndex>#{index + 1}</TpCardIndex>
      <ChampAvatarCard name={champ.name} src={imgUrl} />

      <TpCardInfo>
        <TpCardName>{champ.name}</TpCardName>
        <TpCardSub>
          ({champ.slug}) —{" "}
          {type === "pick" ? "средний пикрейт" : "средний банрейт"}:{" "}
          <span style={{ fontWeight: 600 }}>{totalValue.toFixed(2)}%</span>
        </TpCardSub>
      </TpCardInfo>

      <TpCardValue>{totalValue.toFixed(2)}%</TpCardValue>
    </TpCard>
  );
}

function DetailsModal({
  data,
  onClose,
}: {
  data: null | { index: number; champ: any; type: "pick" | "ban" };
  onClose: () => void;
}) {
  if (!data) return null;

  const { index, champ, type } = data;
  const totalValue =
    type === "pick" ? champ.totalPickRate || 0 : champ.totalBanRate || 0;
  const lanes = champ.lanes || {};

  const laneEntries = Object.entries(lanes)
    .filter(([, laneData]: any) => {
      const val = type === "pick" ? laneData.pick || 0 : laneData.ban || 0;
      return val > 0;
    })
    .sort(([, a]: any, [, b]: any) => {
      const av = type === "pick" ? a.pick || 0 : a.ban || 0;
      const bv = type === "pick" ? b.pick || 0 : b.ban || 0;
      return bv - av;
    });

  return (
    <TpModalOverlay onClick={onClose}>
      <TpModal onClick={(e) => e.stopPropagation()}>
        <TpModalTop>
          <div style={{ minWidth: 0 }}>
            <div style={{ marginBottom: 4 }}>
              {index + 1}. {String(champ.name).toUpperCase()} ({champ.slug}) —{" "}
              {type === "pick" ? "средний пикрейт" : "средний банрейт"}:{" "}
              <b>{totalValue.toFixed(2)}%</b>
            </div>
          </div>
          <TpCloseBtn onClick={onClose}>✕</TpCloseBtn>
        </TpModalTop>

        {laneEntries.map(([laneKey, laneData]: any) => {
          const laneTotal =
            type === "pick" ? laneData.pick || 0 : laneData.ban || 0;
          const ranksObj =
            type === "pick"
              ? laneData.pickRanks || {}
              : laneData.banRanks || {};

          const parts: string[] = [];
          for (const rk of RANK_KEYS) {
            if (!ranksObj[rk] || EXCLUDED_RANK_KEYS.has(rk)) continue;
            const label = RANK_LABELS_RU[rk] || rk;
            parts.push(`${label}: ${Number(ranksObj[rk]).toFixed(2)}%`);
          }

          const displayLaneName =
            type === "ban" && laneKey === "all" ? "все линии" : laneKey;

          return (
            <TpLaneRow key={laneKey}>
              - {displayLaneName}: {laneTotal.toFixed(2)}%
              {parts.length > 0 ? <> (из них: {parts.join(", ")})</> : null}
            </TpLaneRow>
          );
        })}

        {!laneEntries.length ? (
          <div>Для этого чемпиона нет детальной статистики.</div>
        ) : null}
      </TpModal>
    </TpModalOverlay>
  );
}

export default function PicksBansPage() {
  const language = "ru_ru";

  const [champions, setChampions] = useState<any[]>([]);
  const [champImages, setChampImages] = useState<Record<string, string | null>>(
    {}
  );
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<any>(null);

  const [limit, setLimit] = useState<5 | 10 | 20 | "all">(5);
  const [rankRange, setRankRange] = useState<"low" | "high" | "all">("low");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/champions?lang=${encodeURIComponent(language)}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;

        setChampions(json || []);
        const imgMap: Record<string, string | null> = {};
        (json || []).forEach((ch: any) => {
          if (ch?.slug) imgMap[ch.slug] = ch.icon || null;
        });
        setChampImages(imgMap);
      } catch {
        // не критично
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/champion-history`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;

        const items = Array.isArray(json.items) ? json.items : [];
        setHistoryItems(items);
      } catch {
        if (!cancelled)
          setError("Не удалось загрузить статистику пиков и банов.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const aggregated = useMemo(() => {
    if (!Array.isArray(historyItems) || historyItems.length === 0) return [];

    const lastDateBySlug: Record<string, string> = {};
    for (const item of historyItems) {
      if (!item?.slug || !item?.date) continue;
      const slug = item.slug;
      const dateStr = String(item.date);
      if (!lastDateBySlug[slug] || dateStr > lastDateBySlug[slug]) {
        lastDateBySlug[slug] = dateStr;
      }
    }

    const latestItems = historyItems.filter((item) => {
      if (!item?.slug || !item?.date) return false;
      return String(item.date) === lastDateBySlug[item.slug];
    });

    const champBySlug: Record<string, any> = {};
    for (const ch of champions) {
      if (ch?.slug) champBySlug[ch.slug] = ch;
    }

    const aggBySlug = new Map<string, any>();

    for (const item of latestItems) {
      const slug = item.slug;
      const rankKey = item.rank;
      const laneKey = item.lane;

      if (!slug || !rankKey || !laneKey) continue;
      if (EXCLUDED_RANK_KEYS.has(rankKey)) continue;

      if (rankRange === "low" && !LOW_ELO_RANKS.has(rankKey)) continue;
      if (rankRange === "high" && !HIGH_ELO_RANKS.has(rankKey)) continue;

      const pickRate = item.pickRate ?? 0;
      const banRate = item.banRate ?? 0;

      if (!aggBySlug.has(slug)) {
        const champion = champBySlug[slug];
        const displayName =
          champion?.name && typeof champion.name === "string"
            ? champion.name
            : slug;

        aggBySlug.set(slug, {
          slug,
          name: displayName,
          totalPickRate: 0,
          totalBanRate: 0,
          lanes: {
            all: { pick: 0, ban: 0, pickRanks: {}, banRanks: {} },
          },
          _totalPickSum: 0,
          _totalPickCount: 0,
          _totalBanSum: 0,
          _totalBanCount: 0,
          _banRanksAdded: new Set<string>(),
        });
      }

      const agg = aggBySlug.get(slug);
      const lanes = agg.lanes;

      if (!lanes[laneKey]) {
        lanes[laneKey] = {
          pick: 0,
          ban: 0,
          pickRanks: {},
          banRanks: {},
          _pickSum: 0,
          _pickCount: 0,
        };
      }

      agg._totalPickSum += pickRate;
      agg._totalPickCount += 1;
      lanes[laneKey]._pickSum += pickRate;
      lanes[laneKey]._pickCount += 1;
      lanes[laneKey].pickRanks[rankKey] =
        (lanes[laneKey].pickRanks[rankKey] || 0) + pickRate;

      if (!agg._banRanksAdded.has(rankKey)) {
        agg._totalBanSum += banRate;
        agg._totalBanCount += 1;
        lanes.all.banRanks[rankKey] =
          (lanes.all.banRanks[rankKey] || 0) + banRate;
        agg._banRanksAdded.add(rankKey);
      }
    }

    const result: any[] = [];
    for (const value of aggBySlug.values()) {
      value.totalPickRate =
        value._totalPickCount > 0
          ? value._totalPickSum / value._totalPickCount
          : 0;
      value.totalBanRate =
        value._totalBanCount > 0
          ? value._totalBanSum / value._totalBanCount
          : 0;

      for (const [laneKey, laneData] of Object.entries<any>(value.lanes)) {
        if (laneKey === "all") continue;
        const c = laneData._pickCount || 0;
        const s = laneData._pickSum || 0;
        laneData.pick = c > 0 ? s / c : 0;
        delete laneData._pickSum;
        delete laneData._pickCount;
      }

      value.lanes.all.ban = value.totalBanRate;

      delete value._totalPickSum;
      delete value._totalPickCount;
      delete value._totalBanSum;
      delete value._totalBanCount;
      delete value._banRanksAdded;

      if (value.totalPickRate === 0 && value.totalBanRate === 0) continue;
      result.push(value);
    }

    return result;
  }, [historyItems, champions, rankRange]);

  const topPicks = useMemo(() => {
    const sorted = [...aggregated].sort(
      (a, b) => (b.totalPickRate || 0) - (a.totalPickRate || 0)
    );
    return limit === "all" ? sorted : sorted.slice(0, limit);
  }, [aggregated, limit]);

  const topBans = useMemo(() => {
    const sorted = [...aggregated].sort(
      (a, b) => (b.totalBanRate || 0) - (a.totalBanRate || 0)
    );
    return limit === "all" ? sorted : sorted.slice(0, limit);
  }, [aggregated, limit]);

  const limitLabel =
    limit === "all" ? "все чемпионы" : `топ-${limit} чемпионов`;
  const limitTitlePrefix = limit === "all" ? "Все чемпионы" : `Топ-${limit}`;
  const rankRangeLabel =
    rankRange === "low"
      ? "в алмазе+мастере"
      : rankRange === "high"
      ? "в гм+чалике"
      : "во всех рангах";

  if (loading) return <LoadingRing label="Считаю пики и баны…" />;

  return (
    <PageWrapper showBack>
      {error ? (
        <div style={{ padding: 12, opacity: 0.9 }}>{error}</div>
      ) : (
        <>
          <TpHeader>
            <TpHeaderText>
              Ниже — {limitLabel} по среднему пикрейту и среднему банрейту за
              последний день {rankRangeLabel} и на всех линиях. Нажми на
              карточку чемпиона, чтобы увидеть подробности.
            </TpHeaderText>
          </TpHeader>

          <TpRow>
            <TpPillButton onClick={() => setLimit(5)} $active={limit === 5}>
              Топ 5
            </TpPillButton>
            <TpPillButton onClick={() => setLimit(10)} $active={limit === 10}>
              Топ 10
            </TpPillButton>
            <TpPillButton onClick={() => setLimit(20)} $active={limit === 20}>
              Топ 20
            </TpPillButton>
            <TpPillButton
              onClick={() => setLimit("all")}
              $active={limit === "all"}
            >
              Все
            </TpPillButton>
          </TpRow>

          <TpRow>
            <TpPillButton
              onClick={() => setRankRange("low")}
              $active={rankRange === "low"}
            >
              Лоу эло
            </TpPillButton>
            <TpPillButton
              onClick={() => setRankRange("high")}
              $active={rankRange === "high"}
            >
              Хай эло
            </TpPillButton>
            <TpPillButton
              onClick={() => setRankRange("all")}
              $active={rankRange === "all"}
            >
              Все ранги
            </TpPillButton>
          </TpRow>

          <TpSection $mb={12}>
            <TpSectionTitle $pad>{limitTitlePrefix} по пикам</TpSectionTitle>

            {topPicks.map((champ, idx) => (
              <TpCardWrap key={`pick-${champ.slug}`}>
                <TopChampCard
                  index={idx}
                  champ={champ}
                  type="pick"
                  imgUrl={champImages[champ.slug]}
                  onClick={() =>
                    setDetails({ index: idx, champ, type: "pick" })
                  }
                />
              </TpCardWrap>
            ))}

            {!topPicks.length ? (
              <TpEmpty>Нет данных для расчёта пиков.</TpEmpty>
            ) : null}
          </TpSection>

          <TpSection $mb={0}>
            <TpSectionTitle>{limitTitlePrefix} по банам</TpSectionTitle>

            {topBans.map((champ, idx) => (
              <TpCardWrap key={`ban-${champ.slug}`}>
                <TopChampCard
                  index={idx}
                  champ={champ}
                  type="ban"
                  imgUrl={champImages[champ.slug]}
                  onClick={() => setDetails({ index: idx, champ, type: "ban" })}
                />
              </TpCardWrap>
            ))}

            {!topBans.length ? (
              <TpEmpty>Нет данных для расчёта банов.</TpEmpty>
            ) : null}
          </TpSection>

          <DetailsModal data={details} onClose={() => setDetails(null)} />
        </>
      )}
    </PageWrapper>
  );
}
