"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import SearchField from "@/components/ui/SearchField";
import styles from "@/app/admin/admin.module.css";

type ChampionOption = {
  slug: string;
  name: string;
  iconUrl?: string;
};

type RunSummary = {
  id: string;
  scope: "all" | "single";
  slug?: string | null;
  status: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  processedCount?: number | null;
  targetCount?: number | null;
  passedCount?: number | null;
  failedCount?: number | null;
  issueCount?: number | null;
  mismatchCount?: number | null;
  checkedCombos?: number | null;
  lastSlug?: string | null;
  errorMessage?: string | null;
};

type FailureSection = {
  label: string;
  count: number;
};

type IssueRow = {
  section: string;
  message: string;
  details?: Record<string, unknown>;
};

type MismatchRow = {
  rank: string;
  lane: string;
  sectionLabel: string;
  status: string;
  siteDataDate?: string | null;
  sourceDataDate?: string | null;
  siteVisibleCount?: number;
  siteTotalCount?: number;
  sourceVisibleCount?: number;
  sourceTotalCount?: number;
};

type ChampionAuditRow = {
  slug: string;
  ok: boolean;
  checkedCombos: number;
  expectedWrfVariants: number;
  issuesCount: number;
  mismatchCount: number;
  failedSections: string[];
  mismatches: MismatchRow[];
  issues: IssueRow[];
};

type ChampionProblemEntry = {
  kind: "mismatch" | "issue";
  key: string;
  source: string;
  block: string;
  combo: string;
  error: string;
  reason: string;
};

type AuditReport = {
  id: string;
  scope: "all" | "single";
  slug?: string | null;
  status: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  totals?: {
    champions?: number;
    passed?: number;
    failed?: number;
    issues?: number;
    mismatches?: number;
    checkedCombos?: number;
  };
  failureSections?: FailureSection[];
  championRows?: ChampionAuditRow[];
  failedChampions?: ChampionAuditRow[];
};

type AuditPayload = {
  ok?: boolean;
  running?: boolean;
  activeRun?: RunSummary | null;
  runs?: RunSummary[];
  report?: AuditReport | null;
  selectedRunId?: string | null;
};

const AUDIT_DISPLAY_TIME_ZONE = "Europe/Moscow";
const EMPTY_RUNS: RunSummary[] = [];
const RANK_LABELS: Record<string, string> = {
  diamond_plus: "Алмаз",
  master: "Мастер",
  grandmaster: "ГМ",
  challenger: "Претендент",
};
const LANE_LABELS: Record<string, string> = {
  top: "Барон",
  jungle: "Лес",
  mid: "Мид",
  adc: "Дракон",
  support: "Саппорт",
};

function formatDateTime(value?: string | null) {
  if (!value) return "n/a";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: AUDIT_DISPLAY_TIME_ZONE,
  }).format(parsed);
}

function formatRunLabel(run?: RunSummary | null) {
  if (!run) return "Прогон не выбран";
  if (run.scope === "single" && run.slug) {
    return `Точечный прогон: ${run.slug}`;
  }
  return "Полный прогон";
}

function formatStatusLabel(run?: RunSummary | null, report?: AuditReport | null) {
  const status = report?.status || run?.status || "idle";

  if (status === "running") return "Идёт";
  if (status === "passed") return "Успешно";
  if (status === "failed") return "Есть падения";
  return "Ожидание";
}

function formatRankLabel(value = "") {
  return RANK_LABELS[String(value || "").trim()] || value || "n/a";
}

function formatLaneLabel(value = "") {
  return LANE_LABELS[String(value || "").trim()] || value || "n/a";
}

function formatMismatchStatus(status = "") {
  if (status === "source-drift") return "Источник отстаёт";
  if (status === "same-date-mismatch") return "Данные не совпали";
  if (status === "missing-source-data") return "В источнике нет данных";
  return status || "Проблема сравнения";
}

function formatIssueSection(section = "") {
  if (!section) return "Общий блок";
  if (section === "compare") return "Сравнение";
  if (section === "riftgg") return "RiftGG";
  if (section === "wildriftfire") return "WildRiftFire";
  if (section === "ui") return "UI";
  return section;
}

function formatIssueDetails(details?: Record<string, unknown>) {
  const entries = Object.entries(details || {}).filter(([, value]) => {
    if (value == null) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  });

  if (!entries.length) return "";

  return entries
    .map(([key, value]) => {
      const label = key
        .replace(/([A-Z])/g, " $1")
        .replace(/[_-]+/g, " ")
        .trim()
        .toLowerCase();
      const rendered = Array.isArray(value) ? value.join(", ") : String(value);
      return `${label}: ${rendered}`;
    })
    .join(" • ");
}

function formatMismatchReason(row: MismatchRow) {
  const siteDate = row.siteDataDate || "n/a";
  const sourceDate = row.sourceDataDate || "n/a";

  if (row.status === "source-drift") {
    return `На сайте стоит другой или более свежий срез: сайт ${siteDate}, RiftGG ${sourceDate}.`;
  }

  if (!row.sourceVisibleCount && !row.sourceTotalCount) {
    return `В RiftGG для этого блока сейчас нет строк: сайт показывает ${row.siteVisibleCount || 0}, источник ${row.sourceVisibleCount || 0}.`;
  }

  if (row.status === "same-date-mismatch") {
    return `Дата одинаковая (${siteDate}), но содержимое блока отличается: сайт ${row.siteVisibleCount || 0}/${row.siteTotalCount || 0}, RiftGG ${row.sourceVisibleCount || 0}/${row.sourceTotalCount || 0}.`;
  }

  return `Сайт ${row.siteVisibleCount || 0}/${row.siteTotalCount || 0}, RiftGG ${row.sourceVisibleCount || 0}/${row.sourceTotalCount || 0}, даты ${siteDate} vs ${sourceDate}.`;
}

function buildChampionProblemEntries(champion: ChampionAuditRow): ChampionProblemEntry[] {
  const mismatchEntries = champion.mismatches.map((row, index) => ({
    kind: "mismatch" as const,
    key: `${champion.slug}-mismatch-${index}`,
    source: "RiftGG",
    block: row.sectionLabel || "Сравнение",
    combo: `${formatRankLabel(row.rank)} / ${formatLaneLabel(row.lane)}`,
    error: formatMismatchStatus(row.status),
    reason: formatMismatchReason(row),
  }));

  const issueEntries = champion.issues.map((issue, index) => ({
    kind: "issue" as const,
    key: `${champion.slug}-issue-${index}`,
    source: formatIssueSection(issue.section),
    block: formatIssueSection(issue.section),
    combo: "Общий прогон",
    error: issue.message || "Issue",
    reason: formatIssueDetails(issue.details) || "Подробная причина не была сохранена в отчёте.",
  }));

  return [...mismatchEntries, ...issueEntries];
}

function pluralizeGuideWord(count: number) {
  const value = Math.abs(Number(count || 0)) % 100;
  const mod10 = value % 10;

  if (value > 10 && value < 20) return "гайдов";
  if (mod10 === 1) return "гайд";
  if (mod10 >= 2 && mod10 <= 4) return "гайда";
  return "гайдов";
}

async function fetchAuditPayload(runId = ""): Promise<AuditPayload> {
  const query = runId ? `?runId=${encodeURIComponent(runId)}` : "";
  const response = await fetch(`/api/admin/guides-audit${query}`, {
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || "guides_audit_unavailable");
  }

  return payload || {};
}

async function clearAuditPayload(): Promise<AuditPayload> {
  const response = await fetch("/api/admin/guides-audit", {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || "guides_audit_clear_failed");
  }

  return payload || {};
}

export default function AdminGuidesAuditClient({
  champions,
  initialPayload,
}: {
  champions: ChampionOption[];
  initialPayload: AuditPayload | null;
}) {
  const initialSlug =
    champions[0]?.slug || "";
  const initialChampion =
    champions.find((item) => item.slug === initialSlug) || null;
  const [payload, setPayload] = useState<AuditPayload>(initialPayload || {});
  const [mode, setMode] = useState<"all" | "single">("all");
  const [slug, setSlug] = useState<string>(initialSlug);
  const [championSearch, setChampionSearch] = useState(
    initialChampion ? `${initialChampion.name} (${initialChampion.slug})` : initialSlug,
  );
  const [isChampionPickerOpen, setIsChampionPickerOpen] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string>(
    initialPayload?.selectedRunId ||
      initialPayload?.activeRun?.id ||
      initialPayload?.report?.id ||
      initialPayload?.runs?.[0]?.id ||
      "",
  );
  const [errorText, setErrorText] = useState("");
  const [noticeText, setNoticeText] = useState("");
  const [isPending, startTransition] = useTransition();
  const championPickerRef = useRef<HTMLDivElement | null>(null);

  const runs = useMemo(() => payload.runs ?? EMPTY_RUNS, [payload.runs]);
  const report = payload.report || null;
  const activeRun = payload.activeRun || null;
  const selectedRun = useMemo(() => {
    if (selectedRunId) {
      const matchedRun = runs.find((item) => item.id === selectedRunId);
      if (matchedRun) {
        return matchedRun;
      }

      if (activeRun?.id === selectedRunId) {
        return activeRun;
      }

      return null;
    }

    return runs[0] || activeRun || null;
  }, [activeRun, runs, selectedRunId]);
  const failureRows = useMemo(
    () =>
      [...(report?.failedChampions || [])].sort(
        (left, right) =>
          right.mismatchCount - left.mismatchCount ||
          right.issuesCount - left.issuesCount ||
          left.slug.localeCompare(right.slug),
      ),
    [report],
  );
  const selectedRunError =
    !payload.running && selectedRun?.status === "failed"
      ? String(selectedRun?.errorMessage || "").trim()
      : "";
  const filteredChampions = useMemo(() => {
    const normalizedSearch = championSearch.trim().toLowerCase();

    return champions
      .filter((item) => {
        if (!normalizedSearch) return true;
        return (
          item.name.toLowerCase().includes(normalizedSearch) ||
          item.slug.toLowerCase().includes(normalizedSearch)
        );
      })
      .slice(0, 10);
  }, [championSearch, champions]);

  useEffect(() => {
    if (!payload.running) {
      return;
    }

    const timer = window.setInterval(() => {
      const runId = selectedRunId || activeRun?.id || "";
      startTransition(() => {
        void fetchAuditPayload(runId)
          .then((nextPayload) => {
            setPayload(nextPayload);
            if (nextPayload.selectedRunId) {
              setSelectedRunId(nextPayload.selectedRunId);
            }
          })
          .catch((error: Error) => {
            setErrorText(error.message || "guides_audit_unavailable");
          });
      });
    }, 4000);

    return () => window.clearInterval(timer);
  }, [activeRun?.id, payload.running, selectedRunId]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!championPickerRef.current?.contains(event.target as Node)) {
        setIsChampionPickerOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  async function refresh(runId = selectedRunId) {
    setErrorText("");
    const nextPayload = await fetchAuditPayload(runId);
    setPayload(nextPayload);
    if (nextPayload.selectedRunId) {
      setSelectedRunId(nextPayload.selectedRunId);
    }
  }

  async function handleRunStart() {
    setErrorText("");
    setNoticeText("");

    const response = await fetch("/api/admin/guides-audit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        mode,
        slug: mode === "single" ? slug : null,
      }),
    });
    const nextPayload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(nextPayload?.error || "guides_audit_start_failed");
    }

    const nextRun = nextPayload?.run || null;
    if (nextRun?.id) {
      setPayload((currentPayload) => {
        const currentRuns = currentPayload.runs ?? EMPTY_RUNS;
        return {
          ...currentPayload,
          running: true,
          activeRun: nextRun,
          report: null,
          selectedRunId: nextRun.id,
          runs: [
            nextRun,
            ...currentRuns.filter((item) => item.id !== nextRun.id),
          ],
        };
      });
    }

    setNoticeText(
      mode === "single" && slug
        ? `Запустил аудит для ${slug}.`
        : "Запустил полный аудит по всем гайдам.",
    );

    if (nextPayload?.run?.id) {
      setSelectedRunId(nextPayload.run.id);
    }

    await refresh(nextPayload?.run?.id || "");
  }

  async function handleClearReports() {
    if (!runs.length && !activeRun && !report) {
      setNoticeText("История прогонов уже пустая.");
      return;
    }

    const isConfirmed = window.confirm(
      "Очистить всю историю прогонов и отчётов guides audit?",
    );

    if (!isConfirmed) {
      return;
    }

    setErrorText("");
    setNoticeText("");

    const nextPayload = await clearAuditPayload();
    setPayload(nextPayload);
    setSelectedRunId("");
    setNoticeText("История прогонов очищена.");
  }

  function pickChampion(nextSlug: string) {
    const nextChampion = champions.find((item) => item.slug === nextSlug) || null;
    setSlug(nextSlug);
    setChampionSearch(
      nextChampion ? `${nextChampion.name} (${nextChampion.slug})` : nextSlug,
    );
    setIsChampionPickerOpen(false);
  }

  const totals = report?.totals || {};
  const queueTotal = selectedRun?.targetCount || totals.champions || 0;
  const processedCount = payload.running
    ? selectedRun?.processedCount || 0
    : totals.champions || selectedRun?.processedCount || 0;
  const passedCount = totals.passed || selectedRun?.passedCount || 0;
  const failedCount = totals.failed || selectedRun?.failedCount || 0;
  const mismatchCount = totals.mismatches || selectedRun?.mismatchCount || 0;
  const issueCount = totals.issues || selectedRun?.issueCount || 0;
  const checkedCombosCount = totals.checkedCombos || selectedRun?.checkedCombos || 0;
  const remainingCount = Math.max(0, queueTotal - processedCount);
  const progressSummary = payload.running
    ? `Сейчас обработано ${processedCount} из ${queueTotal || "?"} ${pluralizeGuideWord(queueTotal)}. Из них ${passedCount} успешно, ${failedCount} с проблемами, осталось ${remainingCount}.`
    : `В этом прогоне было ${queueTotal} ${pluralizeGuideWord(queueTotal)}: ${passedCount} успешно, ${failedCount} с проблемами, mismatch-ов ${mismatchCount}, issues ${issueCount}.`;

  return (
    <div className={styles.auditStack}>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <div className={styles.sectionEyebrow}>Guides Audit</div>
            <h2 className={styles.panelTitle}>Импорт и проверка гайдов</h2>
            <p className={styles.cardText}>
              Здесь можно запустить прогон по одному чемпиону или по всему пулу и сразу увидеть,
              где именно ломается матчап, руны, заклинания или UI-доставка.
            </p>
          </div>
          <div className={styles.auditStatusWrap}>
            <span className={`${styles.auditStatusPill} ${payload.running ? styles.auditStatusRunning : report?.status === "passed" ? styles.auditStatusOk : styles.auditStatusFail}`}>
              {formatStatusLabel(selectedRun, report)}
            </span>
            <span className={styles.auditMetaText}>{formatRunLabel(selectedRun)}</span>
          </div>
        </div>

        {errorText ? <div className={styles.error}>{errorText}</div> : null}
        {!errorText && selectedRunError ? (
          <div className={styles.error}>
            {`Выбранный прогон завершился с ошибкой: ${selectedRunError}`}
          </div>
        ) : null}
        {noticeText ? <div className={styles.notice}>{noticeText}</div> : null}

        <div className={styles.auditControls}>
          <label className={styles.auditModeCard}>
            <input
              type="radio"
              name="audit-mode"
              value="all"
              checked={mode === "all"}
              onChange={() => setMode("all")}
            />
            <span>Все чемпионы</span>
          </label>

          <label className={styles.auditModeCard}>
            <input
              type="radio"
              name="audit-mode"
              value="single"
              checked={mode === "single"}
              onChange={() => setMode("single")}
            />
            <span>Конкретный чемпион</span>
          </label>

          <label className={styles.auditSelectWrap}>
            <span className={styles.statLabel}>Slug чемпиона</span>
            <div
              ref={championPickerRef}
              className={styles.auditPicker}
            >
              <SearchField
                value={championSearch}
                onChange={(value) => {
                  setChampionSearch(value);
                  setIsChampionPickerOpen(true);
                }}
                placeholder={mode === "single" ? "Начни вводить имя или slug" : "Выбери режим конкретного чемпиона"}
                ariaLabel="Поиск чемпиона для точечного аудита"
                className={styles.auditSearch}
                autoComplete="off"
                disabled={mode !== "single" || isPending || payload.running}
                onFocus={() => {
                  if (mode === "single") {
                    setIsChampionPickerOpen(true);
                  }
                }}
              />
              {mode === "single" && isChampionPickerOpen ? (
                <div className={styles.auditPickerResults}>
                  {filteredChampions.length ? (
                    filteredChampions.map((item) => (
                      <button
                        key={item.slug}
                        type="button"
                        className={`${styles.auditPickerOption} ${item.slug === slug ? styles.auditPickerOptionActive : ""}`.trim()}
                        onClick={() => pickChampion(item.slug)}
                        disabled={isPending || payload.running}
                      >
                        <span className={styles.auditPickerOptionName}>{item.name}</span>
                        <span className={styles.auditPickerOptionSlug}>{item.slug}</span>
                      </button>
                    ))
                  ) : (
                    <div className={styles.auditPickerEmpty}>Ничего не найдено.</div>
                  )}
                </div>
              ) : null}
            </div>
          </label>

          <div className={styles.auditActionRow}>
            <button
              type="button"
              className={`${styles.button} ${styles.auditActionButton}`}
              onClick={() => {
                startTransition(() => {
                  void handleRunStart().catch((error: Error) => {
                    setErrorText(error.message || "guides_audit_start_failed");
                  });
                });
              }}
              disabled={isPending || payload.running || (mode === "single" && !slug)}
            >
              {payload.running ? "Прогон уже идёт" : isPending ? "Запускаю..." : "Запустить аудит"}
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonDanger} ${styles.auditActionButton}`}
              onClick={() => {
                startTransition(() => {
                  void handleClearReports().catch((error: Error) => {
                    setErrorText(error.message || "guides_audit_clear_failed");
                  });
                });
              }}
              disabled={isPending || payload.running || (!runs.length && !report)}
            >
              Очистить отчёты
            </button>
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2 className={styles.panelTitle}>Сводка прогона</h2>
            <p className={styles.cardText}>
              Отдельно считаем чемпионов, mismatch-и, issues и суммарное число проверенных комбинаций.
            </p>
          </div>
          <label className={styles.auditSelectWrap}>
            <span className={styles.statLabel}>Исторический прогон</span>
            <select
              className={styles.auditSelect}
              value={selectedRunId}
              onChange={(event) => {
                const nextRunId = event.target.value;
                setSelectedRunId(nextRunId);
                startTransition(() => {
                  void refresh(nextRunId).catch((error: Error) => {
                    setErrorText(error.message || "guides_audit_unavailable");
                  });
                });
              }}
            >
              {(runs.length ? runs : activeRun ? [activeRun] : []).map((run) => (
                <option key={run.id} value={run.id}>
                  {`${formatDateTime(run.startedAt)} • ${formatRunLabel(run)}`}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.auditStatsGrid}>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Всего в очереди</span>
            <strong className={styles.statValue}>{queueTotal}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Обработано</span>
            <strong className={styles.statValue}>{processedCount}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Успешно</span>
            <strong className={styles.statValue}>{passedCount}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>С проблемами</span>
            <strong className={styles.statValue}>{failedCount}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Mismatch-и</span>
            <strong className={styles.statValue}>{mismatchCount}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Issues</span>
            <strong className={styles.statValue}>{issueCount}</strong>
          </article>
        </div>

        <p className={styles.auditSummaryText}>{progressSummary}</p>

        <div className={styles.auditProgressCard}>
          <div className={styles.auditProgressMeta}>
            <span className={styles.statLabel}>Прогресс</span>
            <span className={styles.auditMetaText}>
              {payload.running
                ? `${processedCount} / ${queueTotal || "?"}`
                : `Старт ${formatDateTime(report?.startedAt || selectedRun?.startedAt)}`}
            </span>
          </div>
          <div className={styles.auditProgressTrack}>
            <div
              className={styles.auditProgressFill}
              style={{
                width: `${queueTotal ? Math.max(6, Math.min(100, (processedCount / queueTotal) * 100)) : 8}%`,
              }}
            />
          </div>
          <div className={styles.auditMetaRow}>
            <span className={styles.auditMetaText}>
              Начало: {formatDateTime(report?.startedAt || selectedRun?.startedAt)}
            </span>
            <span className={styles.auditMetaText}>
              Комбо: {checkedCombosCount}
            </span>
            <span className={styles.auditMetaText}>
              Конец: {formatDateTime(report?.finishedAt || selectedRun?.finishedAt)}
            </span>
            {selectedRun?.lastSlug ? (
              <span className={styles.auditMetaText}>Последний: {selectedRun.lastSlug}</span>
            ) : null}
          </div>
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2 className={styles.panelTitle}>Список ошибок</h2>
            <p className={styles.cardText}>
              Аккордеон по чемпионам: внутри строки в формате источник, блок, комбинация, ошибка и причина.
            </p>
          </div>
        </div>

        {report?.failureSections?.length ? (
          <div className={styles.auditSectionPills}>
            {report.failureSections.map((item) => (
              <span key={item.label} className={styles.pill}>
                {item.label}: {item.count}
              </span>
            ))}
          </div>
        ) : null}

        {failureRows.length ? (
          <div className={styles.auditAccordionList}>
            {failureRows.map((champion) => (
              <details key={champion.slug} className={styles.auditAccordionItem} open>
                <summary className={styles.auditAccordionSummary}>
                  <div>
                    <h3 className={styles.cardTitle}>{champion.slug}</h3>
                    <p className={styles.auditMetaText}>
                      mismatch-и: {champion.mismatchCount} • issues: {champion.issuesCount} • комбо: {champion.checkedCombos}
                    </p>
                  </div>
                  <div className={styles.auditAccordionMeta}>
                    <span className={`${styles.auditStatusPill} ${styles.auditStatusFail}`}>Проблема</span>
                    <span className={styles.auditAccordionCount}>
                      {champion.mismatchCount + champion.issuesCount} записей
                    </span>
                  </div>
                </summary>

                {champion.failedSections.length ? (
                  <div className={styles.auditSectionPills}>
                    {champion.failedSections.map((item) => (
                      <span key={`${champion.slug}-${item}`} className={styles.pill}>{item}</span>
                    ))}
                  </div>
                ) : null}

                <div className={styles.auditProblemList}>
                  {buildChampionProblemEntries(champion).map((entry) => (
                    <article key={entry.key} className={styles.auditProblemCard}>
                      <div className={styles.auditProblemGrid}>
                        <div>
                          <span className={styles.auditProblemLabel}>Выгрузка</span>
                          <strong className={styles.auditProblemValue}>{entry.source}</strong>
                        </div>
                        <div>
                          <span className={styles.auditProblemLabel}>Блок</span>
                          <strong className={styles.auditProblemValue}>{entry.block}</strong>
                        </div>
                        <div>
                          <span className={styles.auditProblemLabel}>Комбинация</span>
                          <strong className={styles.auditProblemValue}>{entry.combo}</strong>
                        </div>
                        <div>
                          <span className={styles.auditProblemLabel}>Ошибка</span>
                          <strong className={styles.auditProblemValue}>{entry.error}</strong>
                        </div>
                      </div>
                      <p className={styles.auditProblemReason}>{entry.reason}</p>
                    </article>
                  ))}
                </div>
              </details>
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>
            {report?.status === "passed"
              ? "В выбранном прогоне проблемных чемпионов нет."
              : "Пока нет завершённого отчёта для выбранного прогона."}
          </p>
        )}
      </section>
    </div>
  );
}
