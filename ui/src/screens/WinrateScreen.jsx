import { useEffect, useMemo, useState } from "react";
import PageWrapper from "../components/PageWrapper.jsx";
import { RankFilter } from "../components/RankFilter.jsx";
import { LaneFilter } from "../components/LaneFilter.jsx";

import {
  WrWrap,
  WrHeader,
  WrRow,
  WrHeroCell,
  WrHeroName,
  WrRight,
  WrSortable,
  WrIndex,
  WrAvatar,
  WrAvatarImg,
} from "../components/styled/WinrateScreen.styled.js";

import LoadingRing from "../components/LoadingRing.jsx";

import { API_BASE } from "../constants.js";

function ChampAvatar({ name, src }) {
  return <WrAvatar>{src && <WrAvatarImg src={src} alt={name} />}</WrAvatar>;
}

function winRateColor(v) {
  if (v == null) return "inherit";
  if (v > 50) return "#4ade80";
  if (v < 50) return "#f97373";
  return "inherit";
}

function pickRateColor(v) {
  if (v == null) return "inherit";
  if (v < 3) return "#f97373";
  return "#4ade80";
}

function banRateColor(v) {
  if (v == null) return "inherit";
  if (v > 10) return "#f97373";
  return "#4ade80";
}

function strengthToTier(level) {
  if (level == null) return { label: "—", color: "#9ca3af" };

  switch (level) {
    case 0:
      return { label: "S+", color: "#f97316" };
    case 1:
      return { label: "S", color: "#f97316" };
    case 2:
      return { label: "A", color: "#22c55e" };
    case 3:
      return { label: "B", color: "#eab308" };
    case 4:
      return { label: "C", color: "#9ca3af" };
    case 5:
    default:
      return { label: "D", color: "#6b7280" };
  }
}

export function WinrateScreen({ language = "ru_ru", onBack }) {
  const [champions, setChampions] = useState([]);
  const [latestStats, setLatestStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [rankKey, setRankKey] = useState("diamondPlus");
  const [laneKey, setLaneKey] = useState("top");

  const [sort, setSort] = useState({ column: "winRate", dir: "desc" });

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

        setChampions(champsJson || []);

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
        console.error("Ошибка загрузки данных для WinrateScreen", e);
        if (!cancelled) setError("Не удалось загрузить статистику винрейтов.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [language]);

  function onSort(column) {
    setSort((prev) => {
      if (prev.column !== column) return { column, dir: "desc" };
      if (prev.dir === "desc") return { column, dir: "asc" };
      if (prev.dir === "asc") return { column: null, dir: null };
      return { column, dir: "desc" };
    });
  }

  const rows = useMemo(() => {
    if (!champions.length || !latestStats) return [];

    return champions
      .map((champ) => {
        const slug = champ.slug;
        if (!slug) return null;

        const key = `${slug}|${rankKey}|${laneKey}`;
        const stat = latestStats[key];
        if (!stat) return null;

        const displayName =
          typeof champ.name === "string" && champ.name.trim()
            ? champ.name
            : slug;

        const strengthLevel =
          stat.strengthLevel !== undefined ? stat.strengthLevel : null;

        const tier = strengthToTier(strengthLevel);

        return {
          slug,
          name: displayName,
          icon: champ.icon || null,

          winRate: stat.winRate ?? null,
          pickRate: stat.pickRate ?? null,
          banRate: stat.banRate ?? null,

          strengthLevel,
          tierLabel: tier.label,
          tierColor: tier.color,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (!sort.column || !sort.dir)
          return (b.winRate || 0) - (a.winRate || 0);

        const col = sort.column;

        if (col === "strengthLevel") {
          const av = a.strengthLevel ?? 999;
          const bv = b.strengthLevel ?? 999;
          if (sort.dir === "desc") return av - bv;
          if (sort.dir === "asc") return bv - av;
          return 0;
        }

        const av = a[col] ?? 0;
        const bv = b[col] ?? 0;

        if (sort.dir === "desc") return bv - av;
        if (sort.dir === "asc") return av - bv;
        return 0;
      });
  }, [champions, latestStats, rankKey, laneKey, sort]);

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
      loadingText="Загружаю статистику…"
      wrapInCard
    >
      <WrWrap>
        <WrHeader>
          <div>#</div>
          <div>Герой</div>

          <WrSortable onClick={() => onSort("strengthLevel")}>
            Тир{" "}
            {sort.column === "strengthLevel"
              ? sort.dir === "asc"
                ? "▲"
                : "▼"
              : ""}
          </WrSortable>

          <WrSortable onClick={() => onSort("winRate")}>
            Победы{" "}
            {sort.column === "winRate" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
          </WrSortable>

          <WrSortable onClick={() => onSort("pickRate")}>
            Пики{" "}
            {sort.column === "pickRate" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
          </WrSortable>

          <WrSortable onClick={() => onSort("banRate")}>
            Баны{" "}
            {sort.column === "banRate" ? (sort.dir === "asc" ? "▲" : "▼") : ""}
          </WrSortable>
        </WrHeader>

        {rows.map((row, idx) => (
          <WrRow key={row.slug}>
            <WrIndex>{idx + 1}</WrIndex>

            <WrHeroCell>
              <ChampAvatar name={row.name} src={row.icon} />
              <WrHeroName>{row.name}</WrHeroName>
            </WrHeroCell>

            <WrRight style={{ fontWeight: 700, color: row.tierColor }}>
              {row.tierLabel}
            </WrRight>

            <WrRight style={{ color: winRateColor(row.winRate) }}>
              {row.winRate != null ? `${row.winRate.toFixed(2)}%` : "—"}
            </WrRight>

            <WrRight style={{ color: pickRateColor(row.pickRate) }}>
              {row.pickRate != null ? `${row.pickRate.toFixed(2)}%` : "—"}
            </WrRight>

            <WrRight style={{ color: banRateColor(row.banRate) }}>
              {row.banRate != null ? `${row.banRate.toFixed(2)}%` : "—"}
            </WrRight>
          </WrRow>
        ))}

        {!rows.length && !loading && (
          <LoadingRing label="ЗАГРУЗКА" logoText="L" />
        )}
      </WrWrap>
    </PageWrapper>
  );
}
