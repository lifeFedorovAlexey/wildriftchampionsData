"use client";

import { useDeferredValue, useEffect, useMemo, useState, type DragEvent } from "react";
import Link from "next/link";
import ChampionAvatar from "@/components/ui/ChampionAvatar";
import SearchField from "@/components/ui/SearchField";
import { RoleIcon } from "@/components/RoleIcon";
import { tierBg } from "@/components/styled/tierlist";
import TrendSparkline from "@/components/styled/TrendSparkline";
import type {
  StreamerChampionOption,
  StreamerLaneKey,
  StreamerPublication,
  StreamerTierChampion,
  StreamerTierKey,
  StreamerTierlistEditorPayload,
} from "@/lib/streamer-tierlists-api";
import {
  buildDraftFromPublication,
  countAssignedForLane,
  getAssignedSlugsForLane,
  moveChampionInDraft,
  STREAMER_LANE_LABELS,
  type StreamerDraftLayout,
} from "./editor-lib";
import type { WinrateRow, WinratesRowsBySlice } from "@/app/winrates/types";
import styles from "./streamer.module.css";

const STREAMER_STATS_RANK_KEY = "overall";

function formatDateLabel(value: string | null | undefined) {
  if (!value) return "Еще не опубликовано";

  try {
    return new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "medium",
      timeStyle: value.includes("T") ? "short" : undefined,
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function isEditedPublication(
  publication:
    | { publishedAt: string | null; editedAt: string | null }
    | null
    | undefined,
) {
  return Boolean(publication?.editedAt && publication.editedAt !== publication.publishedAt);
}

function getPublicationStateLabel(
  publication:
    | { publishedAt: string | null; editedAt: string | null }
    | null
    | undefined,
) {
  return isEditedPublication(publication) ? "Отредактировано" : "Опубликовано";
}

function getPublicationStateDate(
  publication:
    | { publishedAt: string | null; editedAt: string | null }
    | null
    | undefined,
) {
  return isEditedPublication(publication) ? publication?.editedAt : publication?.publishedAt;
}

function buildChampionFallbackMap(publication: StreamerPublication | null | undefined) {
  const fallback = new Map<string, StreamerTierChampion>();
  const lanes = publication?.payload?.lanes;

  if (!lanes) {
    return fallback;
  }

  for (const laneValue of Object.values(lanes)) {
    const lane = laneValue?.tiers || {};
    for (const champions of Object.values(lane)) {
      for (const champion of Array.isArray(champions) ? champions : []) {
        const slug = String(champion?.slug || "").trim().toLowerCase();
        if (!slug || fallback.has(slug)) continue;
        fallback.set(slug, champion);
      }
    }
  }

  return fallback;
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function formatDayLabel(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function formatMetricValue(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(2)}%` : "—";
}

function buildMetricDelta(current: number | null, previous: number | null) {
  if (
    typeof current !== "number" ||
    !Number.isFinite(current) ||
    typeof previous !== "number" ||
    !Number.isFinite(previous)
  ) {
    return null;
  }

  return Number((current - previous).toFixed(2));
}

function formatMetricDelta(value: number | null) {
  if (value == null) {
    return { text: "—", className: styles.metricDeltaFlat };
  }

  if (Math.abs(value) < 0.01) {
    return { text: "0.00", className: styles.metricDeltaFlat };
  }

  if (value > 0) {
    return { text: `+${value.toFixed(2)}`, className: styles.metricDeltaUp };
  }

  return { text: value.toFixed(2), className: styles.metricDeltaDown };
}

function buildChampionTrendDays(row: WinrateRow | null, dates: string[] = []) {
  if (!row || !Array.isArray(dates) || !dates.length) return [];

  const safeDates = dates.slice(-7);
  const safeWinRateTrend = Array.isArray(row.winRateTrend) ? row.winRateTrend.slice(-safeDates.length) : [];
  const safePickRateTrend = Array.isArray(row.pickRateTrend) ? row.pickRateTrend.slice(-safeDates.length) : [];
  const safeBanRateTrend = Array.isArray(row.banRateTrend) ? row.banRateTrend.slice(-safeDates.length) : [];

  return safeDates.map((date, index) => {
    const winRate =
      typeof safeWinRateTrend[index] === "number" ? Number(safeWinRateTrend[index].toFixed(2)) : null;
    const pickRate =
      typeof safePickRateTrend[index] === "number" ? Number(safePickRateTrend[index].toFixed(2)) : null;
    const banRate =
      typeof safeBanRateTrend[index] === "number" ? Number(safeBanRateTrend[index].toFixed(2)) : null;
    const rawPreviousWinRate = safeWinRateTrend[index - 1];
    const rawPreviousPickRate = safePickRateTrend[index - 1];
    const rawPreviousBanRate = safeBanRateTrend[index - 1];
    const previousWinRate =
      index > 0 && typeof rawPreviousWinRate === "number"
        ? Number(rawPreviousWinRate.toFixed(2))
        : null;
    const previousPickRate =
      index > 0 && typeof rawPreviousPickRate === "number"
        ? Number(rawPreviousPickRate.toFixed(2))
        : null;
    const previousBanRate =
      index > 0 && typeof rawPreviousBanRate === "number"
        ? Number(rawPreviousBanRate.toFixed(2))
        : null;

    return {
      date,
      winRate,
      pickRate,
      banRate,
      winRateDelta: buildMetricDelta(winRate, previousWinRate),
      pickRateDelta: buildMetricDelta(pickRate, previousPickRate),
      banRateDelta: buildMetricDelta(banRate, previousBanRate),
    };
  });
}

function laneHasItems(
  draft: StreamerDraftLayout,
  lane: StreamerLaneKey,
  tiersOrder: StreamerTierKey[],
) {
  return tiersOrder.some((tier) => (draft[lane]?.[tier] || []).length > 0);
}

type ChampionCardProps = {
  champion: StreamerChampionOption | StreamerTierChampion;
  selected: boolean;
  meta: string;
  compact?: boolean;
  iconOnly?: boolean;
  dropBeforeActive?: boolean;
  mobileSize?: number;
  desktopSize?: number;
  onSelect: () => void;
  onDragStart: (slug: string) => void;
  onDragEnd: () => void;
  onDragOverCard?: (event: DragEvent<HTMLButtonElement>, slug: string) => void;
  onDropBefore?: (event: DragEvent<HTMLButtonElement>, beforeSlug: string) => void;
};

function ChampionCard({
  champion,
  selected,
  meta,
  compact = false,
  iconOnly = false,
  dropBeforeActive = false,
  mobileSize = 42,
  desktopSize = 46,
  onSelect,
  onDragStart,
  onDragEnd,
  onDragOverCard,
  onDropBefore,
}: ChampionCardProps) {
  const tooltip = meta ? `${champion.name} • ${meta}` : champion.name;

  return (
    <button
      type="button"
      draggable
      aria-label={tooltip}
      onClick={onSelect}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", champion.slug);
        event.dataTransfer.effectAllowed = "move";
        onDragStart(champion.slug);
      }}
      onDragEnd={onDragEnd}
      onDragOver={(event) => onDragOverCard?.(event, champion.slug)}
      onDrop={(event) => onDropBefore?.(event, champion.slug)}
      className={`${styles.championCard} ${selected ? styles.championCardSelected : ""} ${
        compact ? styles.championCardCompact : ""
      } ${iconOnly ? styles.championCardIconOnly : ""} ${
        iconOnly ? styles.championCardIconOnlyCompact : ""
      } ${dropBeforeActive ? styles.championCardDropBefore : ""}`.trim()}
    >
      <ChampionAvatar
        name={champion.name}
        src={champion.iconUrl}
        mobileSize={mobileSize}
        desktopSize={desktopSize}
        mobileRadius={iconOnly ? 10 : 12}
        desktopRadius={iconOnly ? 10 : 14}
      />

      {iconOnly ? null : (
        <span className={styles.championCardBody}>
          <span className={styles.championCardName}>{champion.name}</span>
          <span className={styles.championCardMeta}>{meta}</span>
        </span>
      )}
    </button>
  );
}

type Props = {
  initialData: StreamerTierlistEditorPayload;
  winratesSnapshot: {
    rowsBySlice: WinratesRowsBySlice;
    dates: string[];
  };
};

function buildDropTargetKey(target: "pool" | StreamerTierKey, slug?: string | null) {
  return slug ? `${target}:${slug}` : String(target);
}

export default function StreamerTierlistEditor({ initialData, winratesSnapshot }: Props) {
  const [editorData, setEditorData] = useState(initialData);
  const [draft, setDraft] = useState(() =>
    buildDraftFromPublication(
      initialData.currentPublication,
      initialData.laneKeys,
      initialData.tiersOrder,
    ),
  );
  const [selectedLane, setSelectedLane] = useState<StreamerLaneKey>(
    initialData.laneKeys[0] || "top",
  );
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [dragSlug, setDragSlug] = useState<string | null>(null);
  const [activeDropTarget, setActiveDropTarget] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [search, setSearch] = useState("");
  const [metaOnly, setMetaOnly] = useState(true);
  const deferredSearch = useDeferredValue(search);
  const [inspectedSlug, setInspectedSlug] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: "idle" | "ok" | "error"; text: string }>({
    type: "idle",
    text: "",
  });
  const [isPublishing, setIsPublishing] = useState(false);

  const tiersOrder = editorData.tiersOrder;
  const laneKeys = editorData.laneKeys;
  const currentPublication = editorData.currentPublication || null;

  const championLookup = useMemo(() => {
    const map = new Map<string, StreamerChampionOption | StreamerTierChampion>();

    for (const champion of editorData.champions) {
      map.set(champion.slug, champion);
    }

    for (const [slug, champion] of buildChampionFallbackMap(currentPublication)) {
      if (!map.has(slug)) {
        map.set(slug, champion);
      }
    }

    return map;
  }, [currentPublication, editorData.champions]);

  const assignedSet = useMemo(
    () => getAssignedSlugsForLane(draft, selectedLane, tiersOrder),
    [draft, selectedLane, tiersOrder],
  );

  const metaChampionSlugsForLane = useMemo(
    () => editorData.metaChampionSlugsByLane?.[selectedLane] || [],
    [editorData.metaChampionSlugsByLane, selectedLane],
  );

  const catalogChampionBySlug = useMemo(
    () => new Map(editorData.champions.map((champion) => [champion.slug, champion])),
    [editorData.champions],
  );

  const poolChampions = useMemo(() => {
    const query = normalizeSearch(deferredSearch);
    const baseChampions = metaOnly
      ? metaChampionSlugsForLane
          .flatMap((slug) => {
            const champion = catalogChampionBySlug.get(slug);
            return champion ? [champion] : [];
          })
      : editorData.champions;

    return baseChampions.filter((champion) => {
      if (assignedSet.has(champion.slug)) return false;
      if (!query) return true;

      const haystack = [
        champion.name,
        champion.slug,
        ...(Array.isArray(champion.roles) ? champion.roles : []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [
    assignedSet,
    catalogChampionBySlug,
    deferredSearch,
    editorData.champions,
    metaChampionSlugsForLane,
    metaOnly,
  ]);

  const selectedChampion = selectedSlug ? championLookup.get(selectedSlug) || null : null;
  const selectedChampionTier =
    selectedSlug
      ? (tiersOrder.find((tier) => (draft[selectedLane]?.[tier] || []).includes(selectedSlug)) ||
          null)
      : null;
  const inspectedChampion = inspectedSlug ? championLookup.get(inspectedSlug) || null : null;
  const inspectedRow = useMemo(() => {
    const sliceKey = `${STREAMER_STATS_RANK_KEY}|${selectedLane}`;
    const rows = Array.isArray(winratesSnapshot.rowsBySlice?.[sliceKey])
      ? winratesSnapshot.rowsBySlice[sliceKey]
      : [];
    return rows.find((row) => row.slug === inspectedSlug) || null;
  }, [inspectedSlug, selectedLane, winratesSnapshot.rowsBySlice]);
  const inspectedDays = useMemo(
    () => buildChampionTrendDays(inspectedRow, winratesSnapshot.dates),
    [inspectedRow, winratesSnapshot.dates],
  );
  const latestInspectedDay = inspectedDays[inspectedDays.length - 1] || null;

  useEffect(() => {
    if (!inspectedSlug) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setInspectedSlug(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [inspectedSlug]);

  function clearDragState() {
    setDragSlug(null);
    setActiveDropTarget(null);
    setIsDragging(false);
  }

  function handleChampionCardClick(slug: string) {
    setSelectedSlug(slug);
    setInspectedSlug(slug);
  }

  function applyMove(
    slug: string,
    targetTier: StreamerTierKey | null,
    options: { beforeSlug?: string | null } = {},
  ) {
    setDraft((current) =>
      moveChampionInDraft(current, selectedLane, slug, targetTier, tiersOrder, options),
    );
    setSelectedSlug(slug);
    setStatus({ type: "idle", text: "" });
  }

  function resolveDroppedSlug(event: DragEvent<HTMLElement>) {
    return (
      String(event.dataTransfer.getData("text/plain") || "").trim().toLowerCase() ||
      String(dragSlug || "").trim().toLowerCase()
    );
  }

  function moveSelectedChampionTo(targetTier: StreamerTierKey | null) {
    if (!selectedChampion) return;
    if (targetTier === selectedChampionTier) return;
    if (targetTier === null && !selectedChampionTier) return;
    applyMove(selectedChampion.slug, targetTier);
  }

  function handleTierDrop(
    event: DragEvent<HTMLElement>,
    tier: StreamerTierKey,
    options: { beforeSlug?: string | null } = {},
  ) {
    event.preventDefault();
    event.stopPropagation();
    const slug = resolveDroppedSlug(event);
    if (slug) {
      applyMove(slug, tier, options);
    }
    clearDragState();
  }

  async function handlePublish() {
    setIsPublishing(true);
    setStatus({ type: "idle", text: "" });

    try {
      const response = await fetch("/api/me/streamer-tierlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ lanes: draft }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "streamer_tierlist_publish_failed");
      }

      setEditorData(payload);
      setDraft(buildDraftFromPublication(payload.currentPublication, payload.laneKeys, payload.tiersOrder));
      setStatus({
        type: "ok",
        text:
          payload?.publishAction === "unchanged"
            ? "Изменений для публикации нет. Текущая запись за сегодня оставлена без правок."
            : payload?.publishAction === "updated"
            ? "Публикация за сегодня обновлена. В истории отмечено, что запись отредактирована."
            : "Публикация сохранена. В истории появилась новая запись.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        text:
          error instanceof Error
            ? `Не удалось опубликовать тирлист: ${error.message}`
            : "Не удалось опубликовать тирлист.",
      });
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className={`${styles.editorShell} ${isDragging ? styles.dragMode : ""}`.trim()}>
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <div className={styles.heroEyebrow}>Streamer Meta Board</div>
          <h2 className={styles.heroTitle}>Собери собственное видение меты по всем линиям</h2>
          <p className={styles.heroText}>
            Компактный редактор для быстрого раскидывания чемпионов по тирами без длинных
            карточек и лишнего скролла.
          </p>
        </div>

        <div className={styles.heroMeta}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>
              {isEditedPublication(currentPublication) ? "Последнее изменение" : "Последняя публикация"}
            </span>
            <strong className={styles.statValue}>
              {formatDateLabel(getPublicationStateDate(currentPublication))}
            </strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>База меты</span>
            <strong className={styles.statValue}>
              {editorData.sourceSnapshot?.statsDate || "Снапшот пока не найден"}
            </strong>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Публичная страница</span>
            <Link href={`/streamers/${editorData.streamer.id}`} className={styles.statLink}>
              Открыть текущий тирлист
            </Link>
          </div>
        </div>
      </section>

      {status.text ? (
        <div
          className={`${styles.notice} ${
            status.type === "error" ? styles.noticeError : styles.noticeOk
          }`.trim()}
        >
          {status.text}
        </div>
      ) : null}

      <section className={styles.toolbar}>
        <div className={styles.laneTabs} role="tablist" aria-label="Линии">
          {laneKeys.map((lane) => {
            const active = lane === selectedLane;
            return (
              <button
                key={lane}
                type="button"
                className={`${styles.laneTab} ${active ? styles.laneTabActive : ""}`.trim()}
                onClick={() => {
                  setSelectedLane(lane);
                  setSelectedSlug(null);
                }}
                role="tab"
                aria-selected={active}
              >
                <RoleIcon laneKey={lane} size={24} />
                <span>{STREAMER_LANE_LABELS[lane]}</span>
                <span className={styles.laneCount}>
                  {countAssignedForLane(draft, lane, tiersOrder)}
                </span>
              </button>
            );
          })}
        </div>

        <div className={styles.toolbarActions}>
          <button
            type="button"
            className={styles.publishButton}
            onClick={handlePublish}
            disabled={isPublishing}
          >
            {isPublishing ? "Публикую..." : "Опубликовать"}
          </button>
        </div>
      </section>

      <section className={styles.workspace}>
        <div className={styles.board}>
          <div className={styles.sectionHead}>
            <div>
              <h3 className={styles.sectionTitle}>
                Тиры для линии {STREAMER_LANE_LABELS[selectedLane]}
              </h3>
              <p className={styles.sectionText}>
                Клик по полоске отправляет выбранного чемпиона в этот тир. Подробности о герое
                вынесены в tooltip, чтобы на экране помещалось больше иконок.
              </p>
            </div>
          </div>

          <div className={styles.tierList}>
            {tiersOrder.map((tier) => {
              const slugs = draft[selectedLane]?.[tier] || [];

              return (
                <div key={tier} className={styles.tierRow}>
                  <div
                    className={styles.tierBadge}
                    style={{
                      background: tierBg(tier),
                    }}
                  >
                    {tier}
                  </div>

                  <div
                    className={`${styles.tierDropzone} ${
                      activeDropTarget === buildDropTargetKey(tier) ? styles.tierDropzoneActive : ""
                    }`.trim()}
                    onClick={() => moveSelectedChampionTo(tier)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setActiveDropTarget(buildDropTargetKey(tier));
                    }}
                    onDrop={(event) => handleTierDrop(event, tier)}
                  >
                    <div className={styles.tierRowHead}>
                    </div>

                    {slugs.length ? (
                      slugs.map((slug) => {
                        const champion = championLookup.get(slug);
                        if (!champion) return null;

                        return (
                          <ChampionCard
                            key={`${selectedLane}-${tier}-${slug}`}
                            champion={champion}
                            selected={selectedSlug === slug}
                            meta={
                              Array.isArray(champion.roles) && champion.roles.length
                                ? champion.roles.join(" / ")
                                : "Перетащи в другой тир"
                            }
                            compact
                            iconOnly
                            mobileSize={46}
                            desktopSize={50}
                            dropBeforeActive={
                              activeDropTarget === buildDropTargetKey(tier, slug) && dragSlug !== slug
                            }
                            onSelect={() => handleChampionCardClick(slug)}
                            onDragStart={(draggedSlug) => {
                              setIsDragging(true);
                              setDragSlug(draggedSlug);
                              setSelectedSlug(draggedSlug);
                            }}
                            onDragEnd={clearDragState}
                            onDragOverCard={(event, beforeSlug) => {
                              event.preventDefault();
                              setActiveDropTarget(buildDropTargetKey(tier, beforeSlug));
                            }}
                            onDropBefore={(event, beforeSlug) =>
                              handleTierDrop(event, tier, { beforeSlug })
                            }
                          />
                        );
                      })
                    ) : (
                      <div className={styles.emptyDropzone}>
                        {selectedChampion
                          ? "Кликни по полоске или брось иконку сюда."
                          : "Пока пусто"}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <section className={styles.pool}>
          <div className={styles.sectionHead}>
            <div>
              <h3 className={styles.sectionTitle}>Общий пул чемпионов</h3>
              <p className={styles.sectionText}>
                Доступно: {poolChampions.length}. В этой линии уже распределено:{" "}
                {countAssignedForLane(draft, selectedLane, tiersOrder)}.
              </p>
            </div>
          </div>

          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Поиск по имени или роли"
            ariaLabel="Поиск по пулу чемпионов"
            className={styles.poolSearch}
          />

          <label className={styles.poolToggle}>
            <input
              type="checkbox"
              checked={metaOnly}
              onChange={(event) => setMetaOnly(event.target.checked)}
            />
            <span>Только мета этой линии за {editorData.sourceSnapshot?.statsDate || "последний срез"}</span>
          </label>

          <div
            className={`${styles.poolList} ${
              activeDropTarget === buildDropTargetKey("pool") ? styles.poolDropzoneActive : ""
            }`.trim()}
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                moveSelectedChampionTo(null);
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setActiveDropTarget(buildDropTargetKey("pool"));
            }}
            onDrop={(event) => {
              event.preventDefault();
              const slug = resolveDroppedSlug(event);
              if (slug) applyMove(slug, null);
              clearDragState();
            }}
          >
            {poolChampions.length ? (
              poolChampions.map((champion) => (
                <ChampionCard
                  key={`${selectedLane}-pool-${champion.slug}`}
                  champion={champion}
                  selected={selectedSlug === champion.slug}
                  meta={champion.roles.length ? champion.roles.join(" / ") : "Без роли в каталоге"}
                  iconOnly
                  compact
                  mobileSize={46}
                  desktopSize={50}
                  onSelect={() => handleChampionCardClick(champion.slug)}
                  onDragStart={(slug) => {
                    setIsDragging(true);
                    setDragSlug(slug);
                    setSelectedSlug(slug);
                  }}
                  onDragEnd={clearDragState}
                />
              ))
            ) : (
              <div className={styles.emptyPool}>
                {laneHasItems(draft, selectedLane, tiersOrder)
                  ? "Все чемпионы уже распределены по тирам или скрыты поиском."
                  : "Пул пуст только из-за текущего поиска. Очисти строку или начни распределение."}
              </div>
            )}
          </div>
        </section>
      </section>

      <section className={styles.historyCard}>
        <div className={styles.sectionHead}>
          <div>
            <h3 className={styles.sectionTitle}>История публикаций</h3>
            <p className={styles.sectionText}>
              Повторная публикация в тот же день обновляет текущую запись. Новая строка в
              истории появляется только на следующий день.
            </p>
          </div>
        </div>

        <div className={styles.historyList}>
          {editorData.history.length ? (
            editorData.history.map((entry) => (
              <div key={entry.id} className={styles.historyRow}>
                <div>
                  <div className={styles.historyTitle}>
                    {isEditedPublication(entry) ? `Публикация #${entry.id} · Отредактировано` : `Публикация #${entry.id}`}
                  </div>
                  <div className={styles.historyMeta}>
                    {getPublicationStateLabel(entry)}: {formatDateLabel(getPublicationStateDate(entry))}
                  </div>
                </div>
                <div className={styles.historyMeta}>
                  Срез базы: {entry.sourceStatsDate || "не зафиксирован"}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyHistory}>
              Первая публикация появится здесь сразу после сохранения тирлиста.
            </div>
          )}
        </div>
      </section>

      {inspectedChampion ? (
        <div className={styles.statsModalOverlay} onClick={() => setInspectedSlug(null)}>
          <div className={styles.statsModal} onClick={(event) => event.stopPropagation()}>
            <div className={styles.statsModalTop}>
              <div className={styles.statsModalIdentity}>
                <ChampionAvatar
                  name={inspectedChampion.name}
                  src={inspectedChampion.iconUrl}
                  mobileSize={48}
                  desktopSize={56}
                  mobileRadius={14}
                  desktopRadius={16}
                />
                <div className={styles.statsModalMeta}>
                  <div className={styles.statsModalName}>{inspectedChampion.name}</div>
                  <div className={styles.statsModalSubline}>
                    Линия {STREAMER_LANE_LABELS[selectedLane]} · ранг {STREAMER_STATS_RANK_KEY} ·
                    последние 7 дней
                  </div>
                  <div className={styles.statsModalRoles}>
                    {Array.isArray(inspectedChampion.roles) && inspectedChampion.roles.length
                      ? inspectedChampion.roles.join(" / ")
                      : "Роли не указаны"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={styles.statsModalClose}
                onClick={() => setInspectedSlug(null)}
              >
                Закрыть
              </button>
            </div>

            {!inspectedRow ? (
              <div className={styles.statsModalState}>
                Для этой линии в сводной таблице пока нет данных по чемпиону.
              </div>
            ) : null}

            {inspectedRow && inspectedDays.length ? (
              <>
                <div className={styles.statsMetricGrid}>
                  {[
                    {
                      key: "win",
                      label: "Винрейт",
                      value: latestInspectedDay?.winRate ?? null,
                      delta: latestInspectedDay?.winRateDelta ?? null,
                      values: inspectedDays.map((day) => day.winRate),
                      color: "#86efac",
                    },
                    {
                      key: "pick",
                      label: "Пикрейт",
                      value: latestInspectedDay?.pickRate ?? null,
                      delta: latestInspectedDay?.pickRateDelta ?? null,
                      values: inspectedDays.map((day) => day.pickRate),
                      color: "#93c5fd",
                    },
                    {
                      key: "ban",
                      label: "Банрейт",
                      value: latestInspectedDay?.banRate ?? null,
                      delta: latestInspectedDay?.banRateDelta ?? null,
                      values: inspectedDays.map((day) => day.banRate),
                      color: "#fdba74",
                    },
                  ].map((metric) => {
                    const formattedDelta = formatMetricDelta(metric.delta);

                    return (
                      <article key={metric.key} className={styles.statsMetricCard}>
                        <div className={styles.statsMetricHead}>
                          <span className={styles.statsMetricLabel}>{metric.label}</span>
                          <span className={formattedDelta.className}>{formattedDelta.text}</span>
                        </div>
                        <div className={styles.statsMetricValue}>
                          {formatMetricValue(metric.value)}
                        </div>
                        <div className={styles.statsMetricTrend}>
                          <TrendSparkline values={metric.values} color={metric.color} width={112} height={28} />
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className={styles.statsDaysTable}>
                  <div className={styles.statsDaysHead}>
                    <span>Дата</span>
                    <span>WR</span>
                    <span>PR</span>
                    <span>BR</span>
                  </div>

                  {[...inspectedDays].reverse().map((day) => (
                    <div key={day.date} className={styles.statsDaysRow}>
                      <span>{formatDayLabel(day.date)}</span>
                      <span>{formatMetricValue(day.winRate)}</span>
                      <span>{formatMetricValue(day.pickRate)}</span>
                      <span>{formatMetricValue(day.banRate)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
