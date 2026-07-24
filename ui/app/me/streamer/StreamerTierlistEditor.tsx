"use client";

import { useDeferredValue, useEffect, useMemo, useState, type DragEvent } from "react";
import Link from "next/link";
import ChampionAvatar from "@/components/ui/ChampionAvatar";
import SearchField from "@/components/ui/SearchField";
import { RoleIcon } from "@/components/RoleIcon";
import { tierBg } from "@/components/styled/tierlist";
import TrendSparkline from "@/components/styled/TrendSparkline";
import type {
  StreamerBoardKey,
  StreamerChampionOption,
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
import type { WinratesRowsBySlice } from "@/app/winrates/types";
import { buildChampionMetaSlices } from "./streamer-stats-lib";
import styles from "./streamer.module.css";

const STREAMER_RANK_LABELS: Record<string, string> = {
  diamondPlus: "Алмаз",
  masterPlus: "Мастер",
  king: "ГМ",
  peak: "Претендент",
};

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

function formatMetricValue(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(2)}%` : "—";
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

function laneHasItems(
  draft: StreamerDraftLayout,
  lane: StreamerBoardKey,
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
  publishTarget: "public" | "authenticated";
  winratesSnapshot: {
    rowsBySlice: WinratesRowsBySlice;
    dates: string[];
  };
};

function buildDropTargetKey(target: "pool" | StreamerTierKey, slug?: string | null) {
  return slug ? `${target}:${slug}` : String(target);
}

export default function StreamerTierlistEditor({
  initialData,
  publishTarget,
  winratesSnapshot,
}: Props) {
  const [editorData, setEditorData] = useState(initialData);
  const [mode, setMode] = useState<"overall" | "lanes" | null>(
    initialData.currentPublication
      ? initialData.currentPublication.payload?.mode || "lanes"
      : null,
  );
  const [authorName, setAuthorName] = useState(
    initialData.currentPublication?.authorName ||
      (publishTarget === "authenticated" ? initialData.streamer.displayName : ""),
  );
  const [editToken, setEditToken] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [publishChoice, setPublishChoice] = useState<"streamer" | "link" | null>(null);
  const [draft, setDraft] = useState(() =>
    buildDraftFromPublication(
      initialData.currentPublication,
      initialData.laneKeys,
      initialData.tiersOrder,
    ),
  );
  const [selectedLane, setSelectedLane] = useState<StreamerBoardKey>(
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

  useEffect(() => {
    if (publishTarget !== "public") return;
    const publicId = initialData.publicId || initialData.currentPublication?.publicId;
    if (!publicId) return;
    setEditToken(window.localStorage.getItem(`tierlist-edit-token:${publicId}`));
  }, [initialData.currentPublication?.publicId, initialData.publicId, publishTarget]);

  useEffect(() => {
    if (publishTarget !== "public") return;
    if (initialData.publicId || initialData.currentPublication) return;
    const publicId = window.localStorage.getItem("tierlist-last-public-id");
    if (!publicId) return;
    const storedToken = window.localStorage.getItem(`tierlist-edit-token:${publicId}`);
    if (!storedToken) return;

    const controller = new AbortController();
    fetch(`/api/public-tierlists?editor=1&publicId=${encodeURIComponent(publicId)}`, {
      headers: { "x-tierlist-edit-token": storedToken },
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error || "restore_failed");
        return payload as StreamerTierlistEditorPayload;
      })
      .then((payload) => {
        const restoredMode = payload.currentPublication?.payload?.mode || "lanes";
        setEditorData(payload);
        setMode(restoredMode);
        setEditToken(storedToken);
        setAuthorName(payload.currentPublication?.authorName || "");
        setSelectedLane(payload.laneKeys[0] || "top");
        setMetaOnly(restoredMode !== "overall");
        setDraft(
          buildDraftFromPublication(
            payload.currentPublication,
            payload.laneKeys,
            payload.tiersOrder,
          ),
        );
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        window.localStorage.removeItem("tierlist-last-public-id");
      });

    return () => controller.abort();
  }, [initialData.currentPublication, initialData.publicId, publishTarget]);

  function chooseMode(nextMode: "overall" | "lanes") {
    const nextLaneKeys: StreamerBoardKey[] =
      nextMode === "overall" ? ["overall"] : ["top", "jungle", "mid", "adc", "support"];
    setMode(nextMode);
    setSelectedLane(nextLaneKeys[0]);
    setMetaOnly(nextMode !== "overall");
    setEditorData((current) => ({ ...current, mode: nextMode, laneKeys: nextLaneKeys }));
    setDraft(buildDraftFromPublication(null, nextLaneKeys, initialData.tiersOrder));
  }

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
  const inspectedSlices = useMemo(
    () =>
      buildChampionMetaSlices({
        slug: inspectedSlug,
        rowsBySlice: winratesSnapshot.rowsBySlice,
        dates: winratesSnapshot.dates,
      }),
    [inspectedSlug, winratesSnapshot.dates, winratesSnapshot.rowsBySlice],
  );

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
    if (!mode) return;
    const normalizedAuthorName = authorName.trim();
    if (!normalizedAuthorName) {
      setStatus({ type: "error", text: "Укажи имя автора перед публикацией." });
      return;
    }
    setIsPublishing(true);
    setStatus({ type: "idle", text: "" });

    try {
      const response = await fetch(
        publishTarget === "authenticated"
          ? "/api/me/streamer-tierlists"
          : "/api/public-tierlists",
        {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(publishTarget === "public" && editToken
            ? { "x-tierlist-edit-token": editToken }
            : {}),
        },
        body: JSON.stringify({
          mode,
          lanes: draft,
          authorName: normalizedAuthorName,
          publicId: editorData.publicId || currentPublication?.publicId || null,
        }),
        },
      );

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "streamer_tierlist_publish_failed");
      }

      const publication = payload?.publication as StreamerPublication;
      const publicId = publication?.publicId;
      const nextEditToken = payload?.editToken || editToken;
      if (!publication || !publicId) throw new Error("invalid_publish_response");
      if (publishTarget === "public" && payload?.editToken) {
        window.localStorage.setItem(`tierlist-edit-token:${publicId}`, payload.editToken);
        window.localStorage.setItem("tierlist-last-public-id", publicId);
        setEditToken(payload.editToken);
      }
      setEditorData((current) => ({
        ...current,
        publicId,
        currentPublication: publication,
      }));
      setDraft(buildDraftFromPublication(publication, laneKeys, tiersOrder));
      setPublishedUrl(`${window.location.origin}/tierlists/${encodeURIComponent(publicId)}`);
      setPublishChoice(publishTarget === "authenticated" ? "link" : null);
      setStatus({
        type: "ok",
        text: nextEditToken
          ? "Тирлист опубликован. Ссылка доступна всем, у кого она есть."
          : "Тирлист опубликован.",
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

  if (!mode) {
    return (
      <section className={styles.modeChooser} aria-labelledby="tierlist-mode-title">
        <div>
          <div className={styles.heroEyebrow}>Новый тирлист</div>
          <h2 id="tierlist-mode-title" className={styles.heroTitle}>
            Как будем оценивать чемпионов?
          </h2>
          <p className={styles.heroText}>
            Формат выбирается до заполнения, чтобы случайно не потерять расстановку.
          </p>
        </div>
        <div className={styles.modeGrid}>
          <button type="button" className={styles.modeButton} onClick={() => chooseMode("overall")}>
            <strong>Общий тирлист</strong>
            <span>Все чемпионы в одном списке, без разделения по линиям.</span>
          </button>
          <button type="button" className={styles.modeButton} onClick={() => chooseMode("lanes")}>
            <strong>Тирлист по линиям</strong>
            <span>Отдельная расстановка для топа, леса, мида, АДК и саппорта.</span>
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className={`${styles.editorShell} ${isDragging ? styles.dragMode : ""}`.trim()}>
      <section className={styles.hero}>
        <div className={styles.heroMain}>
          <div className={styles.heroEyebrow}>
            {mode === "overall" ? "Общий тирлист" : "Тирлист по линиям"}
          </div>
          <h2 className={styles.heroTitle}>Расставь чемпионов по тирам</h2>
          <p className={styles.heroText}>
            Перетащи чемпионов из пула справа. После публикации получишь открытую ссылку.
          </p>
        </div>

        <div className={styles.heroControls}>
          <label className={styles.authorField}>
            <span>Имя автора</span>
            <input
              value={authorName}
              required
              aria-required="true"
              maxLength={48}
              onChange={(event) => setAuthorName(event.target.value)}
              placeholder="Как подписать тирлист"
            />
          </label>
          <div className={styles.publicationMeta}>
            {currentPublication
              ? `${getPublicationStateLabel(currentPublication)} ${formatDateLabel(
                  getPublicationStateDate(currentPublication),
                )}`
              : `База меты: ${editorData.sourceSnapshot?.statsDate || "последний срез"}`}
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

      {publishedUrl ? (
        <div className={styles.publishOverlay} role="presentation" onClick={() => setPublishedUrl(null)}>
          <section
            className={styles.publishDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="tierlist-published-title"
            onClick={(event) => event.stopPropagation()}
          >
            {publishChoice === null ? (
              <>
                <div>
                  <div className={styles.heroEyebrow}>Тирлист опубликован</div>
                  <h2 id="tierlist-published-title" className={styles.publishTitle}>Ты стример?</h2>
                  <p className={styles.publishText}>
                    Стримерские тирлисты можно добавить в публичный каталог. Остальные остаются
                    доступны только по прямой ссылке.
                  </p>
                </div>
                <div className={styles.publishActions}>
                  <button type="button" onClick={() => setPublishChoice("streamer")}>Да, я стример</button>
                  <button type="button" onClick={() => setPublishChoice("link")}>Нет, показать ссылку</button>
                </div>
              </>
            ) : publishChoice === "streamer" ? (
              <>
                <div>
                  <div className={styles.heroEyebrow}>Для стримеров</div>
                  <h2 id="tierlist-published-title" className={styles.publishTitle}>Напиши мне в Telegram</h2>
                  <p className={styles.publishText}>
                    Я добавлю тебе роль стримера. После этого тирлист появится в публичном каталоге.
                  </p>
                </div>
                <div className={styles.publishActions}>
                  <a href="https://t.me/fedorov_alexey_tg" target="_blank" rel="noreferrer">
                    Написать в Telegram
                  </a>
                  <button type="button" onClick={() => setPublishedUrl(null)}>Закрыть</button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div className={styles.heroEyebrow}>Публичная ссылка</div>
                  <h2 id="tierlist-published-title" className={styles.publishTitle}>Тирлист готов</h2>
                  <p className={styles.publishText}>Ссылку сможет открыть любой человек без авторизации.</p>
                </div>
                <div className={styles.publishLinkRow}>
                  <input readOnly value={publishedUrl} aria-label="Публичная ссылка на тирлист" />
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(publishedUrl);
                      setStatus({ type: "ok", text: "Ссылка скопирована." });
                    }}
                  >
                    Копировать
                  </button>
                </div>
                <div className={styles.publishActions}>
                  <Link href={publishedUrl}>Открыть тирлист</Link>
                  <button type="button" onClick={() => setPublishedUrl(null)}>Закрыть</button>
                </div>
              </>
            )}
          </section>
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
                {lane === "overall" ? null : <RoleIcon laneKey={lane} size={24} />}
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
                {mode === "overall"
                  ? "Общий тирлист"
                  : `Тиры для линии ${STREAMER_LANE_LABELS[selectedLane]}`}
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
                Доступно: {poolChampions.length}. Уже распределено:{" "}
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

          {mode === "lanes" ? (
            <label className={styles.poolToggle}>
              <input
                type="checkbox"
                checked={metaOnly}
                onChange={(event) => setMetaOnly(event.target.checked)}
              />
              <span>
                Только мета этой линии за {editorData.sourceSnapshot?.statsDate || "последний срез"}
              </span>
            </label>
          ) : null}

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
                    Текущая мета на {editorData.sourceSnapshot?.statsDate || "последний срез"} ·
                    тренд за 7 дней
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

            {!inspectedSlices.length ? (
              <div className={styles.statsModalState}>
                Чемпион не представлен в текущей мете ни на одной линии или ранге.
              </div>
            ) : null}

            {inspectedSlices.length ? (
              <div className={styles.statsSliceList}>
                {inspectedSlices.map((slice) => {
                  const latestDay = slice.days[slice.days.length - 1] || null;
                  const metrics = [
                    { key: "win", label: "WR", value: latestDay?.winRate ?? null, delta: latestDay?.winRateDelta ?? null, values: slice.days.map((day) => day.winRate), color: "#86efac" },
                    { key: "pick", label: "PR", value: latestDay?.pickRate ?? null, delta: latestDay?.pickRateDelta ?? null, values: slice.days.map((day) => day.pickRate), color: "#93c5fd" },
                    { key: "ban", label: "BR", value: latestDay?.banRate ?? null, delta: latestDay?.banRateDelta ?? null, values: slice.days.map((day) => day.banRate), color: "#fdba74" },
                  ];

                  return (
                    <article key={`${slice.rankKey}|${slice.laneKey}`} className={styles.statsSliceRow}>
                      <div className={styles.statsSliceIdentity}>
                        <strong>{STREAMER_LANE_LABELS[slice.laneKey as StreamerBoardKey]}</strong>
                        <span>{STREAMER_RANK_LABELS[slice.rankKey] || slice.rankKey}</span>
                      </div>
                      <div className={styles.statsSliceMetrics}>
                        {metrics.map((metric) => {
                          const formattedDelta = formatMetricDelta(metric.delta);
                          return (
                            <div key={metric.key} className={styles.statsSliceMetric}>
                              <div className={styles.statsSliceMetricHead}>
                                <span>{metric.label}</span>
                                <strong>{formatMetricValue(metric.value)}</strong>
                                <span className={formattedDelta.className}>{formattedDelta.text}</span>
                              </div>
                              <TrendSparkline values={metric.values} color={metric.color} width={86} height={22} />
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
