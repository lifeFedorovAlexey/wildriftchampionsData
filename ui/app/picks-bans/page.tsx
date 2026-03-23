"use client";

import { useEffect, useMemo, useState } from "react";
import ChampionAvatar from "@/components/ui/ChampionAvatar";
import PageWrapper from "@/components/PageWrapper";
import LoadingRing from "@/components/LoadingRing";
import { API_BASE } from "@/constants/apiBase";
import {
  aggregateLatestPicksBans,
  buildLaneDetails,
} from "./picks-bans-lib";
import {
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
      <ChampionAvatar
        name={champ.name}
        src={imgUrl}
        mobileSize={44}
        desktopSize={64}
        mobileRadius={14}
        desktopRadius={18}
      />

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
  const laneEntries = buildLaneDetails({ champ, type });

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
          <TpCloseBtn onClick={onClose}>×</TpCloseBtn>
        </TpModalTop>

        {laneEntries.map(({ laneKey, laneTotal, parts, displayLaneName }) => (
          <TpLaneRow key={laneKey}>
            - {displayLaneName}: {laneTotal.toFixed(2)}%
            {parts.length > 0 ? <> (из них: {parts.join(", ")})</> : null}
          </TpLaneRow>
        ))}

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
        const res = await fetch(`${API_BASE}/api/latest-stats-snapshot`);
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
    return aggregateLatestPicksBans({
      latestItems: historyItems,
      champions,
      rankRange,
    });
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
    <PageWrapper
      title="Пики и баны в Wild Rift"
      paragraphs={[
        "Здесь показано, каких чемпионов чаще всего выбирают и запрещают в рейтинговых матчах.",
      ]}
    >
      {error ? (
        <div style={{ padding: "var(--space-3)", opacity: 0.9 }}>{error}</div>
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
