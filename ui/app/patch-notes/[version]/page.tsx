import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import PageWrapper from "@/components/PageWrapper";
import { fetchPatchNote, formatPatchDate } from "../patch-notes-lib";
import styles from "../patch-notes.module.css";

type Props = { params: Promise<{ version: string }> };

const ALL_CHANGE_TYPES = ["new", "buff", "adjustment", "rework", "nerf", "removed"] as const;

const CHANGE_GROUPS = [
  { key: "champion-buffs", entityKind: "champion", types: ["buff"], tone: "buff", title: "Усиления чемпионов", eyebrow: "ЧЕМПИОНЫ · БАФФЫ", icon: "+" },
  { key: "champion-changes", entityKind: "champion", types: ["adjustment", "rework"], tone: "adjustment", title: "Изменения чемпионов", eyebrow: "ЧЕМПИОНЫ · ИЗМЕНЕНИЯ", icon: "⚙" },
  { key: "champion-nerfs", entityKind: "champion", types: ["nerf"], tone: "nerf", title: "Ослабления чемпионов", eyebrow: "ЧЕМПИОНЫ · НЕРФЫ", icon: "−" },
  { key: "champion-new", entityKind: "champion", types: ["new"], tone: "new", title: "Новые чемпионы", eyebrow: "ЧЕМПИОНЫ · НОВЫЕ", icon: "NEW" },
  { key: "champion-removed", entityKind: "champion", types: ["removed"], tone: "removed", title: "Удалённые чемпионы", eyebrow: "ЧЕМПИОНЫ · УДАЛЕНЫ", icon: "DEL" },
  { key: "item-buffs", entityKind: "item", types: ["buff"], tone: "buff", title: "Усиления предметов", eyebrow: "ПРЕДМЕТЫ · БАФФЫ", icon: "+" },
  { key: "item-changes", entityKind: "item", types: ["adjustment", "rework"], tone: "adjustment", title: "Изменения предметов", eyebrow: "ПРЕДМЕТЫ · ИЗМЕНЕНИЯ", icon: "⚙" },
  { key: "item-nerfs", entityKind: "item", types: ["nerf"], tone: "nerf", title: "Ослабления предметов", eyebrow: "ПРЕДМЕТЫ · НЕРФЫ", icon: "−" },
  { key: "item-new", entityKind: "item", types: ["new"], tone: "new", title: "Новые предметы", eyebrow: "ПРЕДМЕТЫ · НОВЫЕ", icon: "NEW" },
  { key: "item-removed", entityKind: "item", types: ["removed"], tone: "removed", title: "Удалённые предметы", eyebrow: "ПРЕДМЕТЫ · УДАЛЕНЫ", icon: "DEL" },
  { key: "rune-buffs", entityKind: "rune", types: ["buff"], tone: "buff", title: "Усиления рун", eyebrow: "РУНЫ · БАФФЫ", icon: "+" },
  { key: "rune-changes", entityKind: "rune", types: ["adjustment", "rework"], tone: "adjustment", title: "Изменения рун", eyebrow: "РУНЫ · ИЗМЕНЕНИЯ", icon: "±" },
  { key: "rune-nerfs", entityKind: "rune", types: ["nerf"], tone: "nerf", title: "Ослабления рун", eyebrow: "РУНЫ · НЕРФЫ", icon: "−" },
  { key: "system-changes", entityKind: "system", types: ALL_CHANGE_TYPES, tone: "adjustment", title: "Изменения игры и карты", eyebrow: "ИГРА · КАРТА", icon: "⚙" },
  { key: "skin-changes", entityKind: "skin", types: ALL_CHANGE_TYPES, tone: "adjustment", title: "Облики", eyebrow: "СКИНЫ", icon: "✦" },
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { version } = await params;
  const patch = await fetchPatchNote(version);
  if (!patch) return { title: "Патчноут не найден" };
  return {
    title: patch.title,
    description: `Точные изменения чемпионов, предметов и рун в патче Wild Rift ${patch.version}.`,
    alternates: { canonical: `/patch-notes/${encodeURIComponent(patch.version)}` },
    openGraph: { title: patch.title, type: "article" },
  };
}

export default async function PatchNotePage({ params }: Props) {
  const { version } = await params;
  const patch = await fetchPatchNote(version);
  if (!patch) notFound();

  const entitiesChanged = patch.changes.length;
  const statsChanged = patch.changes.reduce((total, change) => total + change.details.length, 0);

  return (
    <PageWrapper
      title={patch.title}
      paragraphs={[`${formatPatchDate(patch.publishedAt)} · ${patch.locale === "ru-ru" ? "Русский перевод" : "Оригинал на английском"}`]}
      topContent={<Link className={styles.back} href="/patch-notes">← Все патчноуты</Link>}
    >
      <article className={styles.article}>
        <header className={styles.patchSummary}>
          <span className={styles.patchKicker}>PATCH {patch.version}</span>
          <h2>Что изменилось</h2>
          <p>{entitiesChanged} объектов · {statsChanged} точных изменений характеристик</p>
        </header>

        {entitiesChanged ? CHANGE_GROUPS.map((group) => {
          const changes = patch.changes.filter((change) => (
            change.entityKind === group.entityKind && group.types.includes(change.changeType as never)
          ));
          if (!changes.length) return null;
          return (
            <section key={group.key} className={`${styles.changeGroup} ${styles[group.tone]}`}>
              <div className={styles.groupTitle}>
                <span className={styles.groupIcon} aria-hidden="true">{group.icon}</span>
                <div>
                  <span className={styles.groupEyebrow}>{group.eyebrow}</span>
                  <h3>{group.title}</h3>
                </div>
                <span className={styles.groupCount}>{changes.length}</span>
              </div>
              <div className={styles.changeList}>
                {changes.map((change) => (
                  <article key={`${change.entityKind}-${change.entitySlug || change.entityName}-${change.ordinal}`} className={styles.changeCard}>
                    <div className={styles.entityHead}>
                      <div className={styles.entityIcon}>
                        {change.imageUrl ? (
                          <Image src={change.imageUrl} alt="" width={44} height={44} unoptimized />
                        ) : <span aria-hidden="true">{change.entityName.slice(0, 1)}</span>}
                      </div>
                      <div className={styles.entityTitle}>
                        <span className={styles.entityKind}>{entityKindLabel(change.entityKind)}</span>
                        <h4>{change.entityName}</h4>
                      </div>
                    </div>
                    <ul className={styles.detailList}>
                      {groupDetails(change.details).map((group, groupIndex) => (
                        <li className={styles.detailGroup} key={`${group.component || "general"}-${groupIndex}`}>
                          {group.component ? (
                            <span className={styles.componentName}>
                              {cleanComponentName(group.component)}
                              {group.details.length === 1 && group.details[0].label ? (
                                <> <span className={styles.componentDivider}>—</span> {group.details[0].label}</>
                              ) : null}
                            </span>
                          ) : null}
                          <ul className={styles.componentDetails}>
                            {group.details.map((detail, index) => (
                              <li key={`${detail.label || detail.text}-${index}`}>
                                {detail.before && detail.after ? (
                                  <span className={styles.changeValues}>
                                    {detail.label && !(group.component && group.details.length === 1) ? (
                                      <span className={styles.changeLabel}>{detail.label}</span>
                                    ) : null}
                                    <span className={styles.beforeValue}>{detail.before}</span>
                                    <span className={styles.afterValue}>
                                      <span className={styles.arrow} aria-hidden="true">→</span>
                                      {renderChangedNumbers(detail.after, detail.before)}
                                    </span>
                                  </span>
                                ) : detail.label ? (
                                  <><span className={styles.changeLabel}>{detail.label}:</span> {detail.text}</>
                                ) : <span>{detail.text}</span>}
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>
          );
        }) : (
          <p className={styles.emptyChanges}>Для этого патча пока не удалось разобрать строки изменений.</p>
        )}

        <a className={styles.source} href={patch.sourceUrl} target="_blank" rel="noopener noreferrer">
          Источник Riot Games <span aria-hidden="true">↗</span>
        </a>
      </article>
    </PageWrapper>
  );
}

function entityKindLabel(kind: string) {
  if (kind === "champion") return "ЧЕМПИОН";
  if (kind === "item") return "ПРЕДМЕТ";
  if (kind === "rune") return "РУНА";
  if (kind === "skin") return "ОБЛИК";
  return "ИГРА / КАРТА";
}

type ChangeDetail = PatchNote["changes"][number]["details"][number];

function groupDetails(details: ChangeDetail[]) {
  const groups: Array<{ component: string | null; details: ChangeDetail[] }> = [];
  const byComponent = new Map<string, { component: string; details: ChangeDetail[] }>();

  for (const detail of details) {
    const component = detail.component?.trim() || null;
    if (!component) {
      groups.push({ component: null, details: [detail] });
      continue;
    }

    let group = byComponent.get(component);
    if (!group) {
      group = { component, details: [] };
      byComponent.set(component, group);
      groups.push(group);
    }
    group.details.push(detail);
  }

  return groups;
}

function cleanComponentName(value: string) {
  return value.replace(/^Тема:\s*/i, "");
}

function renderChangedNumbers(value: string, baseline: string) {
  const baselineNumbers = baseline.match(/\d+(?:[.,]\d+)?/g) || [];
  let numberIndex = 0;

  return value.split(/(\d+(?:[.,]\d+)?)/g).map((part, index) => {
    if (!/^\d/.test(part)) return part;

    const changed = normalizeNumber(part) !== normalizeNumber(baselineNumbers[numberIndex] || "");
    numberIndex += 1;
    return changed ? <span className={styles.changedNumber} key={index}>{part}</span> : part;
  });
}

function normalizeNumber(value: string) {
  if (!value) return "";
  const number = Number(value.replace(",", "."));
  return Number.isNaN(number) ? value : String(number);
}
