"use client";

import { useEffect, useMemo, useState } from "react";
import PageWrapper from "@/components/PageWrapper";
import LoadingRing from "@/components/LoadingRing";
import { API_BASE } from "@/constants/apiBase";
import {
  aggregateLatestPicksBans,
  buildLaneDetails,
} from "./picks-bans-lib";
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
          ({champ.slug}) вЂ”{" "}
          {type === "pick" ? "СЃСЂРµРґРЅРёР№ РїРёРєСЂРµР№С‚" : "СЃСЂРµРґРЅРёР№ Р±Р°РЅСЂРµР№С‚"}:{" "}
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
              {index + 1}. {String(champ.name).toUpperCase()} ({champ.slug}) вЂ”{" "}
              {type === "pick" ? "СЃСЂРµРґРЅРёР№ РїРёРєСЂРµР№С‚" : "СЃСЂРµРґРЅРёР№ Р±Р°РЅСЂРµР№С‚"}:{" "}
              <b>{totalValue.toFixed(2)}%</b>
            </div>
          </div>
          <TpCloseBtn onClick={onClose}>вњ•</TpCloseBtn>
        </TpModalTop>

        {laneEntries.map(({ laneKey, laneTotal, parts, displayLaneName }) => (
          <TpLaneRow key={laneKey}>
            - {displayLaneName}: {laneTotal.toFixed(2)}%
            {parts.length > 0 ? <> (РёР· РЅРёС…: {parts.join(", ")})</> : null}
          </TpLaneRow>
        ))}

        {!laneEntries.length ? (
          <div>Р”Р»СЏ СЌС‚РѕРіРѕ С‡РµРјРїРёРѕРЅР° РЅРµС‚ РґРµС‚Р°Р»СЊРЅРѕР№ СЃС‚Р°С‚РёСЃС‚РёРєРё.</div>
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
        // РЅРµ РєСЂРёС‚РёС‡РЅРѕ
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
          setError("РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СЃС‚Р°С‚РёСЃС‚РёРєСѓ РїРёРєРѕРІ Рё Р±Р°РЅРѕРІ.");
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
    limit === "all" ? "РІСЃРµ С‡РµРјРїРёРѕРЅС‹" : `С‚РѕРї-${limit} С‡РµРјРїРёРѕРЅРѕРІ`;
  const limitTitlePrefix = limit === "all" ? "Р’СЃРµ С‡РµРјРїРёРѕРЅС‹" : `РўРѕРї-${limit}`;
  const rankRangeLabel =
    rankRange === "low"
      ? "РІ Р°Р»РјР°Р·Рµ+РјР°СЃС‚РµСЂРµ"
      : rankRange === "high"
        ? "РІ РіРј+С‡Р°Р»РёРєРµ"
        : "РІРѕ РІСЃРµС… СЂР°РЅРіР°С…";

  if (loading) return <LoadingRing label="РЎС‡РёС‚Р°СЋ РїРёРєРё Рё Р±Р°РЅС‹вЂ¦" />;

  return (
    <PageWrapper
      showBack
      title="РџРёРєРё Рё Р±Р°РЅС‹ РІ Wild Rift"
      paragraphs={[
        "Р—РґРµСЃСЊ РїРѕРєР°Р·Р°РЅРѕ, РєР°РєРёС… С‡РµРјРїРёРѕРЅРѕРІ С‡Р°С‰Рµ РІСЃРµРіРѕ РІС‹Р±РёСЂР°СЋС‚ Рё Р·Р°РїСЂРµС‰Р°СЋС‚ РІ СЂРµР№С‚РёРЅРіРѕРІС‹С… РјР°С‚С‡Р°С….",
      ]}
    >
      {error ? (
        <div style={{ padding: 12, opacity: 0.9 }}>{error}</div>
      ) : (
        <>
          <TpHeader>
            <TpHeaderText>
              РќРёР¶Рµ вЂ” {limitLabel} РїРѕ СЃСЂРµРґРЅРµРјСѓ РїРёРєСЂРµР№С‚Сѓ Рё СЃСЂРµРґРЅРµРјСѓ Р±Р°РЅСЂРµР№С‚Сѓ Р·Р°
              РїРѕСЃР»РµРґРЅРёР№ РґРµРЅСЊ {rankRangeLabel} Рё РЅР° РІСЃРµС… Р»РёРЅРёСЏС…. РќР°Р¶РјРё РЅР°
              РєР°СЂС‚РѕС‡РєСѓ С‡РµРјРїРёРѕРЅР°, С‡С‚РѕР±С‹ СѓРІРёРґРµС‚СЊ РїРѕРґСЂРѕР±РЅРѕСЃС‚Рё.
            </TpHeaderText>
          </TpHeader>

          <TpRow>
            <TpPillButton onClick={() => setLimit(5)} $active={limit === 5}>
              РўРѕРї 5
            </TpPillButton>
            <TpPillButton onClick={() => setLimit(10)} $active={limit === 10}>
              РўРѕРї 10
            </TpPillButton>
            <TpPillButton onClick={() => setLimit(20)} $active={limit === 20}>
              РўРѕРї 20
            </TpPillButton>
            <TpPillButton
              onClick={() => setLimit("all")}
              $active={limit === "all"}
            >
              Р’СЃРµ
            </TpPillButton>
          </TpRow>

          <TpRow>
            <TpPillButton
              onClick={() => setRankRange("low")}
              $active={rankRange === "low"}
            >
              Р›РѕСѓ СЌР»Рѕ
            </TpPillButton>
            <TpPillButton
              onClick={() => setRankRange("high")}
              $active={rankRange === "high"}
            >
              РҐР°Р№ СЌР»Рѕ
            </TpPillButton>
            <TpPillButton
              onClick={() => setRankRange("all")}
              $active={rankRange === "all"}
            >
              Р’СЃРµ СЂР°РЅРіРё
            </TpPillButton>
          </TpRow>

          <TpSection $mb={12}>
            <TpSectionTitle $pad>{limitTitlePrefix} РїРѕ РїРёРєР°Рј</TpSectionTitle>

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
              <TpEmpty>РќРµС‚ РґР°РЅРЅС‹С… РґР»СЏ СЂР°СЃС‡С‘С‚Р° РїРёРєРѕРІ.</TpEmpty>
            ) : null}
          </TpSection>

          <TpSection $mb={0}>
            <TpSectionTitle>{limitTitlePrefix} РїРѕ Р±Р°РЅР°Рј</TpSectionTitle>

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
              <TpEmpty>РќРµС‚ РґР°РЅРЅС‹С… РґР»СЏ СЂР°СЃС‡С‘С‚Р° Р±Р°РЅРѕРІ.</TpEmpty>
            ) : null}
          </TpSection>

          <DetailsModal data={details} onClose={() => setDetails(null)} />
        </>
      )}
    </PageWrapper>
  );
}
