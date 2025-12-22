import { useEffect, useMemo, useState } from "react";
import PageWrapper from "../components/PageWrapper.jsx";

import {
  TpHeader,
  TpHeaderText,
  TpRow,
  TpSection,
  TpSectionTitle,
  TpCardWrap,
  TpEmpty,
  TpCard,
  TpCardIndex,
  TpAvatar,
  TpAvatarImg,
  TpCardInfo,
  TpCardName,
  TpCardSub,
  TpCardValue,
  TpModalOverlay,
  TpModal,
  TpModalTop,
  TpCloseBtn,
  TpLaneRow,
  TpPillButton,
} from "../components/styled";

import { API_BASE } from "../constants.js";

// порядок рангов и их русские названия
const RANK_KEYS = ["diamondPlus", "masterPlus", "king", "peak"];
const RANK_LABELS_RU = {
  diamondPlus: "Алмаз",
  masterPlus: "Мастер",
  king: "Грандмастер",
  peak: "Претендент",
};

const EXCLUDED_RANK_KEYS = new Set(["overall"]);

// группы эло
const LOW_ELO_RANKS = new Set(["diamondPlus", "masterPlus"]);
const HIGH_ELO_RANKS = new Set(["king", "peak"]);

// аватарка чемпиона
function ChampAvatarCard({ name, src }) {
  return (
    <TpAvatar>
      {src && (
        <TpAvatarImg
          src={src}
          alt={name}
          decoding="async"
          width="64"
          height="64"
        />
      )}
    </TpAvatar>
  );
}

// карточка топ-чемпиона (краткая инфа + клик)
function TopChampCard({ index, champ, type, imgUrl, onClick }) {
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

// модальное окно с полной статистикой
function DetailsModal({ data, onClose }) {
  if (!data) return null;

  const { index, champ, type } = data;
  const totalValue =
    type === "pick" ? champ.totalPickRate || 0 : champ.totalBanRate || 0;

  const lanes = champ.lanes || {};

  const laneEntries = Object.entries(lanes)
    .filter(([, laneData]) => {
      const val = type === "pick" ? laneData.pick || 0 : laneData.ban || 0;
      return val > 0;
    })
    .sort(([, a], [, b]) => {
      const av = type === "pick" ? a.pick || 0 : a.ban || 0;
      const bv = type === "pick" ? b.pick || 0 : b.ban || 0;
      return bv - av;
    });

  return (
    <TpModalOverlay onClick={onClose}>
      <TpModal onClick={(e) => e.stopPropagation()}>
        <TpModalTop>
          <div>
            <div style={{ marginBottom: 4 }}>
              {index + 1}. {champ.name.toUpperCase()} ({champ.slug}) —{" "}
              {type === "pick" ? "средний пикрейт" : "средний банрейт"}:{" "}
              <b>{totalValue.toFixed(2)}%</b>
            </div>
          </div>

          <TpCloseBtn onClick={onClose}>✕</TpCloseBtn>
        </TpModalTop>

        {laneEntries.map(([laneKey, laneData]) => {
          const laneTotal =
            type === "pick" ? laneData.pick || 0 : laneData.ban || 0;

          const ranksObj =
            type === "pick"
              ? laneData.pickRanks || {}
              : laneData.banRanks || {};

          const parts = [];
          for (const rk of RANK_KEYS) {
            if (!ranksObj[rk] || EXCLUDED_RANK_KEYS.has(rk)) continue;
            const label = RANK_LABELS_RU[rk] || rk;
            parts.push(`${label}: ${ranksObj[rk].toFixed(2)}%`);
          }

          const displayLaneName =
            type === "ban" && laneKey === "all" ? "все линии" : laneKey;

          return (
            <TpLaneRow key={laneKey}>
              - {displayLaneName}: {laneTotal.toFixed(2)}%
              {parts.length > 0 && <> (из них: {parts.join(", ")})</>}
            </TpLaneRow>
          );
        })}

        {!laneEntries.length && (
          <div>Для этого чемпиона нет детальной статистики.</div>
        )}
      </TpModal>
    </TpModalOverlay>
  );
}

function TopPicksBansScreen({ language = "ru_ru", onBack }) {
  const [champions, setChampions] = useState([]);
  const [champImages, setChampImages] = useState({});
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState(null);
  const [limit, setLimit] = useState(5); // 5 | 10 | 20 | "all"

  // новый фильтр по эло: low | high | all
  const [rankRange, setRankRange] = useState("low");

  useEffect(() => {
    let cancelled = false;

    async function loadChampions() {
      try {
        const res = await fetch(
          `${API_BASE}/api/champions?lang=${encodeURIComponent(language)}`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;

        setChampions(json || []);

        const imgMap = {};
        (json || []).forEach((ch) => {
          if (ch.slug) imgMap[ch.slug] = ch.icon || null;
        });
        setChampImages(imgMap);
      } catch (e) {
        console.error("Ошибка загрузки champions", e);
      }
    }

    loadChampions();
    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/champion-history`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;

        const items = Array.isArray(json.items) ? json.items : [];
        setHistoryItems(items);
      } catch (e) {
        console.error("Ошибка загрузки champion-history", e);
        if (!cancelled)
          setError("Не удалось загрузить статистику пиков и банов.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  const aggregated = useMemo(() => {
    if (!Array.isArray(historyItems) || historyItems.length === 0) return [];

    const lastDateBySlug = {};
    for (const item of historyItems) {
      if (!item || !item.slug || !item.date) continue;
      const slug = item.slug;
      const dateStr = String(item.date);
      if (!lastDateBySlug[slug] || dateStr > lastDateBySlug[slug]) {
        lastDateBySlug[slug] = dateStr;
      }
    }

    const latestItems = historyItems.filter((item) => {
      if (!item || !item.slug || !item.date) return false;
      const dateStr = String(item.date);
      return dateStr === lastDateBySlug[item.slug];
    });

    const champBySlug = {};
    for (const ch of champions) {
      if (!ch || !ch.slug) continue;
      champBySlug[ch.slug] = ch;
    }

    const aggBySlug = new Map();

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
        let displayName = slug;
        if (champion && typeof champion.name === "string" && champion.name) {
          displayName = champion.name;
        }

        aggBySlug.set(slug, {
          slug,
          name: displayName,

          totalPickRate: 0,
          totalBanRate: 0,

          lanes: {
            all: {
              pick: 0,
              ban: 0,
              pickRanks: {},
              banRanks: {},
            },
          },

          _totalPickSum: 0,
          _totalPickCount: 0,

          _totalBanSum: 0,
          _totalBanCount: 0,

          _banRanksAdded: new Set(),
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
      } else {
        lanes[laneKey]._pickSum = lanes[laneKey]._pickSum ?? 0;
        lanes[laneKey]._pickCount = lanes[laneKey]._pickCount ?? 0;
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

    const result = [];
    for (const value of aggBySlug.values()) {
      const totalPickAvg =
        value._totalPickCount > 0
          ? value._totalPickSum / value._totalPickCount
          : 0;

      const totalBanAvg =
        value._totalBanCount > 0
          ? value._totalBanSum / value._totalBanCount
          : 0;

      value.totalPickRate = totalPickAvg;
      value.totalBanRate = totalBanAvg;

      for (const [laneKey, laneData] of Object.entries(value.lanes)) {
        if (laneKey === "all") continue;

        const c = laneData._pickCount || 0;
        const s = laneData._pickSum || 0;
        laneData.pick = c > 0 ? s / c : 0;

        delete laneData._pickSum;
        delete laneData._pickCount;
      }

      value.lanes.all.ban = totalBanAvg;

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
    if (limit === "all") return sorted;
    return sorted.slice(0, limit);
  }, [aggregated, limit]);

  const topBans = useMemo(() => {
    const sorted = [...aggregated].sort(
      (a, b) => (b.totalBanRate || 0) - (a.totalBanRate || 0)
    );
    if (limit === "all") return sorted;
    return sorted.slice(0, limit);
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

  const renderLimitButton = (value, label) => {
    const isActive = limit === value;
    return (
      <TpPillButton
        key={String(value)}
        onClick={() => setLimit(value)}
        $active={isActive}
        $activeBorder="rgba(59,130,246,0.9)"
        $activeBg="rgba(37,99,235,0.25)"
        $minWidth={44}
      >
        {label}
      </TpPillButton>
    );
  };

  const renderRankRangeButton = (value, label) => {
    const isActive = rankRange === value;
    return (
      <TpPillButton
        key={value}
        onClick={() => setRankRange(value)}
        $active={isActive}
        $activeBorder="rgba(52,211,153,0.9)"
        $activeBg="rgba(16,185,129,0.2)"
        $minWidth={70}
      >
        {label}
      </TpPillButton>
    );
  };

  return (
    <PageWrapper
      onBack={onBack}
      filters={null}
      loading={loading}
      error={!loading ? error : null}
      loadingText="Считаю пики и баны…"
      wrapInCard
    >
      <TpHeader>
        <TpHeaderText>
          Ниже — {limitLabel} по среднему пикрейту и среднему банрейту за
          последний день {rankRangeLabel} и на всех линиях. Нажми на карточку
          чемпиона, чтобы увидеть подробную раскладку по ролям и рангам.
        </TpHeaderText>
      </TpHeader>

      <TpRow>
        {renderLimitButton(5, "Топ 5")}
        {renderLimitButton(10, "Топ 10")}
        {renderLimitButton(20, "Топ 20")}
        {renderLimitButton("all", "Все")}
      </TpRow>

      <TpRow>
        {renderRankRangeButton("low", "Лоу эло")}
        {renderRankRangeButton("high", "Хай эло")}
        {renderRankRangeButton("all", "Все ранги")}
      </TpRow>

      <TpSection $mb={12}>
        <TpSectionTitle $pad>{limitTitlePrefix} по пикам</TpSectionTitle>

        {topPicks.map((champ, idx) => {
          const imgUrl = champImages[champ.slug];
          return (
            <TpCardWrap key={`pick-${champ.slug}`}>
              <TopChampCard
                index={idx}
                champ={champ}
                type="pick"
                imgUrl={imgUrl}
                onClick={() => setDetails({ index: idx, champ, type: "pick" })}
              />
            </TpCardWrap>
          );
        })}

        {!topPicks.length && <TpEmpty>Нет данных для расчёта пиков.</TpEmpty>}
      </TpSection>

      <TpSection $mb={0}>
        <TpSectionTitle>{limitTitlePrefix} по банам</TpSectionTitle>

        {topBans.map((champ, idx) => {
          const imgUrl = champImages[champ.slug];
          return (
            <TpCardWrap key={`ban-${champ.slug}`}>
              <TopChampCard
                index={idx}
                champ={champ}
                type="ban"
                imgUrl={imgUrl}
                onClick={() => setDetails({ index: idx, champ, type: "ban" })}
              />
            </TpCardWrap>
          );
        })}

        {!topBans.length && <TpEmpty>Нет данных для расчёта банов.</TpEmpty>}
      </TpSection>

      <DetailsModal data={details} onClose={() => setDetails(null)} />
    </PageWrapper>
  );
}

export default TopPicksBansScreen;
