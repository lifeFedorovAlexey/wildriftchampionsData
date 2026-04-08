"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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

function buildChartData(runs: RunSummary[] = []) {
  return [...runs]
    .reverse()
    .map((run, index) => ({
      id: run.id,
      name: run.scope === "single" && run.slug ? run.slug : `#${index + 1}`,
      label: formatDateTime(run.startedAt),
      passed: Number(run.passedCount || 0),
      failed: Number(run.failedCount || 0),
      mismatches: Number(run.mismatchCount || 0),
      issues: Number(run.issueCount || 0),
    }));
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
  const selectedRun =
    runs.find((item) => item.id === selectedRunId) ||
    (activeRun?.id === selectedRunId ? activeRun : null) ||
    runs[0] ||
    activeRun ||
    null;
  const chartData = useMemo(() => buildChartData(runs), [runs]);
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

  function pickChampion(nextSlug: string) {
    const nextChampion = champions.find((item) => item.slug === nextSlug) || null;
    setSlug(nextSlug);
    setChampionSearch(
      nextChampion ? `${nextChampion.name} (${nextChampion.slug})` : nextSlug,
    );
    setIsChampionPickerOpen(false);
  }

  const totals = report?.totals || {};
  const progressTotal = selectedRun?.targetCount || totals.champions || 0;
  const progressValue = payload.running
    ? selectedRun?.processedCount || 0
    : totals.champions || selectedRun?.processedCount || 0;

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
              className={styles.button}
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
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={() => {
                startTransition(() => {
                  void refresh().catch((error: Error) => {
                    setErrorText(error.message || "guides_audit_unavailable");
                  });
                });
              }}
              disabled={isPending}
            >
              Обновить
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
            <span className={styles.statLabel}>Чемпионы</span>
            <strong className={styles.statValue}>{totals.champions || selectedRun?.targetCount || 0}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Успешно</span>
            <strong className={styles.statValue}>{totals.passed || selectedRun?.passedCount || 0}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Проблемные</span>
            <strong className={styles.statValue}>{totals.failed || selectedRun?.failedCount || 0}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Mismatch-и</span>
            <strong className={styles.statValue}>{totals.mismatches || selectedRun?.mismatchCount || 0}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Issues</span>
            <strong className={styles.statValue}>{totals.issues || selectedRun?.issueCount || 0}</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Комбо проверено</span>
            <strong className={styles.statValue}>{totals.checkedCombos || selectedRun?.checkedCombos || 0}</strong>
          </article>
        </div>

        <div className={styles.auditProgressCard}>
          <div className={styles.auditProgressMeta}>
            <span className={styles.statLabel}>Прогресс</span>
            <span className={styles.auditMetaText}>
              {payload.running
                ? `${progressValue} / ${progressTotal || "?"}`
                : `Старт ${formatDateTime(report?.startedAt || selectedRun?.startedAt)}`}
            </span>
          </div>
          <div className={styles.auditProgressTrack}>
            <div
              className={styles.auditProgressFill}
              style={{
                width: `${progressTotal ? Math.max(6, Math.min(100, (progressValue / progressTotal) * 100)) : 8}%`,
              }}
            />
          </div>
          <div className={styles.auditMetaRow}>
            <span className={styles.auditMetaText}>
              Начало: {formatDateTime(report?.startedAt || selectedRun?.startedAt)}
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
            <h2 className={styles.panelTitle}>График прогонов</h2>
            <p className={styles.cardText}>
              По истории видно, где растёт число проблемных чемпионов и сколько mismatch-ов приносит каждый запуск.
            </p>
          </div>
        </div>

        {chartData.length ? (
          <div className={styles.auditChartWrap}>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.56)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.56)" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(12,18,30,0.94)",
                    color: "#fff",
                  }}
                  labelFormatter={(value) => `Прогон: ${String(value || "")}`}
                />
                <Bar dataKey="failed" fill="#ff8d6b" radius={[8, 8, 0, 0]} name="Проблемные чемпионы" />
                <Line type="monotone" dataKey="mismatches" stroke="#f5d36c" strokeWidth={3} dot={false} name="Mismatch-и" />
                <Line type="monotone" dataKey="issues" stroke="#74d3ff" strokeWidth={2} dot={false} name="Issues" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className={styles.emptyText}>История запусков пока пустая.</p>
        )}
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2 className={styles.panelTitle}>Падения и mismatch-и</h2>
            <p className={styles.cardText}>
              Сначала идут чемпионы с самым тяжёлым отклонением, ниже можно быстро увидеть, где именно расходятся блоки.
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
          <div className={styles.auditFailureGrid}>
            {failureRows.map((champion) => (
              <article key={champion.slug} className={styles.auditFailureCard}>
                <div className={styles.auditFailureHead}>
                  <div>
                    <h3 className={styles.cardTitle}>{champion.slug}</h3>
                    <p className={styles.auditMetaText}>
                      mismatch-и: {champion.mismatchCount} • issues: {champion.issuesCount} • комбо: {champion.checkedCombos}
                    </p>
                  </div>
                  <span className={`${styles.auditStatusPill} ${styles.auditStatusFail}`}>Проблема</span>
                </div>

                {champion.failedSections.length ? (
                  <div className={styles.auditSectionPills}>
                    {champion.failedSections.map((item) => (
                      <span key={`${champion.slug}-${item}`} className={styles.pill}>{item}</span>
                    ))}
                  </div>
                ) : null}

                {champion.mismatches.length ? (
                  <div className={styles.auditDetailList}>
                    {champion.mismatches.slice(0, 8).map((row, index) => (
                      <div key={`${champion.slug}-mismatch-${index}`} className={styles.auditDetailRow}>
                        <strong>{row.sectionLabel}</strong>
                        <span>
                          {row.rank} / {row.lane} • {row.status} • site {row.siteDataDate || "n/a"} vs source {row.sourceDataDate || "n/a"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {champion.issues.length ? (
                  <div className={styles.auditDetailList}>
                    {champion.issues.slice(0, 6).map((issue, index) => (
                      <div key={`${champion.slug}-issue-${index}`} className={styles.auditDetailRow}>
                        <strong>{issue.section || "issue"}</strong>
                        <span>{issue.message}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
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
