import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";

import PageWrapper from "@/components/PageWrapper";
import PatchNoteEntityHeading from "../PatchNoteEntityHeading";
import PatchNoteSkinGallery from "../PatchNoteSkinGallery";
import { fetchPatchNote, formatPatchDate, patchChangeAnchor, type PatchNote } from "../patch-notes-lib";
import styles from "../patch-notes.module.css";

type Props = { params: Promise<{ version: string }> };

const ALL_CHANGE_TYPES = ["new", "buff", "adjustment", "rework", "nerf", "removed"] as const;

const CHANGE_GROUPS = [
  { key: "champion-buffs", entityKind: "champion", types: ["buff"], tone: "buff", title: "Усиления чемпионов", icon: "↑" },
  { key: "champion-changes", entityKind: "champion", types: ["adjustment"], tone: "adjustment", title: "Изменения чемпионов", icon: "⚙" },
  { key: "champion-reworks", entityKind: "champion", types: ["rework"], tone: "rework", title: "Реворки чемпионов", icon: "⟳" },
  { key: "champion-nerfs", entityKind: "champion", types: ["nerf"], tone: "nerf", title: "Ослабления чемпионов", icon: "↓" },
  { key: "champion-new", entityKind: "champion", types: ["new"], tone: "new", title: "Новые чемпионы", icon: "NEW" },
  { key: "champion-removed", entityKind: "champion", types: ["removed"], tone: "removed", title: "Удалённые чемпионы", icon: "DEL" },
  { key: "item-buffs", entityKind: "item", types: ["buff"], tone: "buff", title: "Усиления предметов", icon: "↑" },
  { key: "item-changes", entityKind: "item", types: ["adjustment"], tone: "adjustment", title: "Изменения предметов", icon: "⚙" },
  { key: "item-reworks", entityKind: "item", types: ["rework"], tone: "rework", title: "Реворки предметов", icon: "⟳" },
  { key: "item-nerfs", entityKind: "item", types: ["nerf"], tone: "nerf", title: "Ослабления предметов", icon: "↓" },
  { key: "item-new", entityKind: "item", types: ["new"], tone: "new", title: "Новые предметы", icon: "NEW" },
  { key: "item-removed", entityKind: "item", types: ["removed"], tone: "removed", title: "Удалённые предметы", icon: "DEL" },
  { key: "rune-buffs", entityKind: "rune", types: ["buff"], tone: "buff", title: "Усиления рун", icon: "↑" },
  { key: "rune-changes", entityKind: "rune", types: ["adjustment"], tone: "adjustment", title: "Изменения рун", icon: "⚙" },
  { key: "rune-reworks", entityKind: "rune", types: ["rework"], tone: "rework", title: "Реворки рун", icon: "⟳" },
  { key: "rune-nerfs", entityKind: "rune", types: ["nerf"], tone: "nerf", title: "Ослабления рун", icon: "↓" },
  { key: "rune-new", entityKind: "rune", types: ["new"], tone: "new", title: "Новые руны", icon: "NEW" },
  { key: "rune-removed", entityKind: "rune", types: ["removed"], tone: "removed", title: "Удалённые руны", icon: "DEL" },
  { key: "spell-buffs", entityKind: "spell", types: ["buff"], tone: "buff", title: "Усиления заклинаний", icon: "↑" },
  { key: "spell-changes", entityKind: "spell", types: ["adjustment"], tone: "adjustment", title: "Изменения заклинаний", icon: "⚙" },
  { key: "spell-reworks", entityKind: "spell", types: ["rework"], tone: "rework", title: "Реворки заклинаний", icon: "⟳" },
  { key: "spell-nerfs", entityKind: "spell", types: ["nerf"], tone: "nerf", title: "Ослабления заклинаний", icon: "↓" },
  { key: "spell-new", entityKind: "spell", types: ["new"], tone: "new", title: "Новые заклинания", icon: "NEW" },
  { key: "spell-removed", entityKind: "spell", types: ["removed"], tone: "removed", title: "Удалённые заклинания", icon: "DEL" },
  { key: "system-changes", entityKind: "system", types: ALL_CHANGE_TYPES, tone: "adjustment", title: "Изменения игры и карты", icon: "⚙" },
  { key: "skin-changes", entityKind: "skin", types: ALL_CHANGE_TYPES, tone: "adjustment", title: "Облики", icon: "✦" },
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
  const statsChanged = patch.changes.reduce((total, change) => (
    total + change.details.filter((detail) => !isRedundantPatchStatus(change, detail)).length
  ), 0);

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
          {patch.effectiveDate ? (
            <p>
              Выход в Китае: {formatPatchDate(patch.effectiveDate)}
              {patch.effectiveDateSourceUrl ? (
                <> · <a href={patch.effectiveDateSourceUrl} target="_blank" rel="noopener noreferrer">источник даты</a></>
              ) : null}
            </p>
          ) : null}
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
                <h3>{group.title}</h3>
                <span className={styles.groupCount}>{changes.length}</span>
              </div>
              {group.entityKind === "skin" ? (
                <PatchNoteSkinGallery changes={changes} />
              ) : (
                <div className={styles.changeList}>
                  {changes.map((change, changeIndex) => {
                    const anchor = patchChangeAnchor(change, change.changeType);
                    const firstOccurrence = changes.findIndex((candidate) => patchChangeAnchor(candidate, candidate.changeType) === anchor) === changeIndex;
                    const details = change.details.filter((detail) => !isRedundantPatchStatus(change, detail));
                    const compactSystemText = change.entityKind === "system" && details.length > 2
                      && details.every((detail) => !detail.label && !detail.before && !detail.after);
                    return (
                      <article
                        key={`${change.entityKind}-${change.entitySlug || change.entityName}-${change.ordinal}`}
                        id={firstOccurrence ? anchor : undefined}
                        className={styles.changeCard}
                        tabIndex={-1}
                      >
                        <PatchNoteEntityHeading change={change} />
                        {details.length ? <ul className={styles.detailList}>
                          {groupDetails(details, compactSystemText).map((detailGroup, groupIndex) => {
                            const collapseRemainder = compactSystemText && detailGroup.component === null && detailGroup.details.length > 1;
                            const visibleDetails = collapseRemainder ? detailGroup.details.slice(0, 1) : detailGroup.details;
                            return (
                              <li className={styles.detailGroup} key={`${detailGroup.component || "general"}-${groupIndex}`}>
                                {detailGroup.component ? (
                                  <span className={styles.componentName}>
                                    {cleanComponentName(detailGroup.component)}
                                    {detailGroup.details.length === 1 && detailGroup.details[0].label ? (
                                      <> <span className={styles.componentDivider}>—</span> {detailGroup.details[0].label}</>
                                    ) : null}
                                  </span>
                                ) : null}
                                <ul className={styles.componentDetails}>
                                  {visibleDetails.map((detail, index) => renderDetailLine(detail, index, detailGroup))}
                                  {collapseRemainder ? (
                                    <li>
                                      <details className={styles.moreSystemDetails}>
                                        <summary>Ещё {detailGroup.details.length - 1}</summary>
                                        <ul className={styles.componentDetails}>
                                          {detailGroup.details.slice(1).map((detail, index) => renderDetailLine(detail, index + 1, detailGroup))}
                                        </ul>
                                      </details>
                                    </li>
                                  ) : null}
                                </ul>
                              </li>
                            );
                          })}
                        </ul> : null}
                      </article>
                    );
                  })}
                </div>
              )}
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

type ChangeDetail = PatchNote["changes"][number]["details"][number];
type DetailGroup = { component: string | null; details: ChangeDetail[] };

function isRedundantPatchStatus(change: PatchNote["changes"][number], detail: ChangeDetail) {
  const text = detail.text.trim().replace(/[.!…]+$/u, "").toLowerCase();
  if (change.changeType === "removed" && /^(?:удал[её]н[аоы]? из игры|removed from (?:the )?game)$/.test(text)) return true;
  if (change.changeType === "new" && /^(?:новый (?:объект|предмет)|new (?:item|object))$/.test(text)) return true;
  return change.entityKind === "skin" && /^(?:облик указан в списке обликов патча|облик доступен в патче|skin listed in the patch skins list|skin available in this patch)$/i.test(text);
}

function renderDetailLine(detail: ChangeDetail, index: number, group: DetailGroup) {
  return (
    <li key={`${detail.label || detail.text}-${index}`}>
      {detail.before && detail.after ? (
        <span className={styles.changeValues}>
          {detail.label && !(group.component && group.details.length === 1) ? (
            <span className={styles.changeLabel}>{detail.label}</span>
          ) : null}
          <span className={styles.beforeValue}>{renderPercentValues(detail.before)}</span>
          <span className={styles.afterValue}>
            <span className={styles.arrow} aria-hidden="true">→</span>
            {renderChangedNumbers(detail.after, detail.before)}
          </span>
        </span>
      ) : detail.label ? (
        <><span className={styles.changeLabel}>{detail.label}:</span> {renderDetailText(detail.text)}</>
      ) : <span>{renderDetailText(detail.text)}</span>}
    </li>
  );
}

function renderDetailText(value: string) {
  const marker = value.match(/^\[(new|buff|nerf|rework|adjustment|removed|deleted|новое|новый|новая|бафф|усиление|нерф|ослабление|реворк|изменение|удалено|удалён|удалена|удалены)\]\s*/i);
  const text = marker ? value.slice(marker[0].length) : value;
  const key = marker?.[1]?.toLowerCase();
  const tone = key ? /^(?:new|новое|новый|новая)$/.test(key) ? "new"
    : /^(?:buff|бафф|усиление)$/.test(key) ? "buff"
      : /^(?:nerf|нерф|ослабление)$/.test(key) ? "nerf"
        : /^(?:rework|реворк)$/.test(key) ? "rework"
          : /^(?:adjustment|изменение)$/.test(key) ? "adjustment" : "removed" : null;
  const label = tone === "new" ? "Новое" : tone === "buff" ? "Усиление" : tone === "nerf" ? "Ослабление"
    : tone === "rework" ? "Реворк" : tone === "adjustment" ? "Изменение" : "Удалено";
  const icon = tone === "new" ? "+" : tone === "buff" ? "↑" : tone === "nerf" ? "↓"
    : tone === "rework" ? "⟳" : tone === "adjustment" ? "⚙" : "×";
  const sentenceEnd = text.search(/[.!?](?=\s|$)/u);
  const hasShortSentence = sentenceEnd > 0 && sentenceEnd < 150;
  const previewLength = hasShortSentence ? sentenceEnd + 1 : 130;

  return (
    <>
      {tone ? (
        <span className={`${styles.inlineChangeMarker} ${styles[`inlineMarker${tone[0].toUpperCase()}${tone.slice(1)}`]}`} role="img" aria-label={label} title={label}>
          {icon}
        </span>
      ) : null}
      {text.length > 150 ? (
        <details className={styles.detailDisclosure}>
          <summary title="Показать полный текст">
            {text.slice(0, previewLength).trimEnd()}{hasShortSentence ? "" : "…"}
          </summary>
          <div>{text}</div>
        </details>
      ) : text}
    </>
  );
}

function groupDetails(details: ChangeDetail[], combineGeneral = false) {
  const groups: DetailGroup[] = [];
  const byComponent = new Map<string, { component: string; details: ChangeDetail[] }>();
  let generalGroup: DetailGroup | null = null;

  for (const detail of details) {
    const component = detail.component?.trim() || null;
    if (!component) {
      if (combineGeneral) {
        if (!generalGroup) {
          generalGroup = { component: null, details: [] };
          groups.push(generalGroup);
        }
        generalGroup.details.push(detail);
        continue;
      }
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

  return value.split(/(\d+(?:[.,]\d+)?\s*%?)/g).map((part, index) => {
    const match = part.match(/^(\d+(?:[.,]\d+)?)(\s*%?)$/);
    if (!match) return part;

    const [, number, suffix] = match;
    const changed = normalizeNumber(number) !== normalizeNumber(baselineNumbers[numberIndex] || "");
    numberIndex += 1;
    const valueNode = changed ? <span className={styles.changedNumber}>{number}</span> : number;
    if (suffix.includes("%")) {
      return <span className={styles.percentValue} key={index}>{valueNode}{suffix}</span>;
    }
    return changed ? <Fragment key={index}><span className={styles.changedNumber}>{number}</span>{suffix}</Fragment> : part;
  });
}

function renderPercentValues(value: string) {
  return value.split(/(\d+(?:[.,]\d+)?\s*%)/g).map((part, index) => (
    /\d/.test(part) && part.includes("%")
      ? <span className={styles.percentValue} key={index}>{part}</span>
      : part
  ));
}

function normalizeNumber(value: string) {
  if (!value) return "";
  const number = Number(value.replace(",", "."));
  return Number.isNaN(number) ? value : String(number);
}
