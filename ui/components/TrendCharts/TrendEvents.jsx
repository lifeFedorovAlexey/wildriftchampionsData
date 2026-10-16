"use client";

import Image from "next/image";
import { ReferenceLine } from "recharts";
import { eventDateLabel, eventTone, layoutPatchMarkers } from "./trend-events-layout.js";
import styles from "./TrendEvents.module.css";

export function PatchIcon({ change }) {
  const tone = eventTone(change.changeType);
  return (
    <span className={`${styles.icon} ${change.entityKind === "champion" ? styles.champion : ""}`} style={{ "--event-color": tone.color }}>
      {change.imageUrl ? <Image src={change.imageUrl} alt="" width={36} height={36} unoptimized />
        : <span className={styles.fallback}>{change.entityName.slice(0, 2)}</span>}
      <span className={styles.badge} aria-hidden="true">{tone.symbol}</span>
    </span>
  );
}

export function PatchEventRail({ patches, days, width, selected, onSelect, detailId }) {
  const { markers, height } = layoutPatchMarkers(patches, days, width);
  if (!height) return null;
  return (
    <div className={styles.rail} style={{ height }} aria-label="Изменения в патчах">
      <svg className={styles.connectors} width={width} height={height} aria-hidden="true">
        {markers.map((patch) => <path key={patch.version}
          d={`M ${patch.left + patch.width / 2} ${patch.top + 56} L ${patch.x} ${height - 4} V ${height}`}
          stroke={selected?.version === patch.version ? "#94a3b8" : "#475569"} fill="none" />)}
      </svg>
      {markers.map((patch) => (
        <div key={patch.version} className={styles.patch} style={{ left: patch.left, top: patch.top, width: patch.width }}>
          <button type="button" className={styles.patchLabel}
            aria-label={`Патч ${patch.version}, ${eventDateLabel(patch.date)}: все изменения`}
            aria-expanded={selected?.version === patch.version && !selected?.entityId}
            aria-controls={detailId}
            onClick={(event) => onSelect({ version: patch.version, entityId: null }, event)}>
            {patch.version}<span>{eventDateLabel(patch.date)}</span>
          </button>
          <div className={styles.icons}>
            {patch.changes.slice(0, patch.changes.length > 3 ? 2 : 3).map((change) => {
              const label = `${change.entityName} · ${eventTone(change.changeType).label} · ${patch.version}${change.relation ? " · в текущей сборке" : ""}`;
              return <button type="button" key={change.id} className={styles.iconButton}
                title={label} aria-label={label} aria-controls={detailId}
                aria-expanded={selected?.version === patch.version && selected?.entityId === change.id}
                onClick={(event) => onSelect({ version: patch.version, entityId: change.id }, event)}>
                <PatchIcon change={change} />
              </button>;
            })}
            {patch.changes.length > 3 ? <button type="button" className={styles.more}
              aria-label={`Ещё ${patch.changes.length - 2} изменения в патче ${patch.version}`}
              aria-controls={detailId}
              onClick={(event) => onSelect({ version: patch.version, entityId: null }, event)}>+{patch.changes.length - 2}</button> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function SeasonLabel({ viewBox, season, width }) {
  const x = viewBox?.x || 0;
  const atRightEdge = x > width - 70;
  return <text x={x + (atRightEdge ? -4 : 4)} y={18} textAnchor={atRightEdge ? "end" : "start"} fill="#c4b5fd" fontSize={10}>
    <title>{`Новый ${season.name.toLowerCase()} · ${eventDateLabel(season.date)} · CN`}</title>
    <a href={season.sourceUrl} target="_blank" rel="noreferrer">{season.name}</a>
  </text>;
}

function PatchLabel({ viewBox, patch, width }) {
  return <text x={Math.max(60, Math.min(width - 28, (viewBox?.x || 0) - 10))} y={31} fill="#94a3b8" fontSize={9}>{patch.version}</text>;
}

// Return reference elements directly so Recharts discovers each line.
export function trendReferenceLines({ patches = [], seasons = [], width, compact = false }) {
  return [
    ...patches.map((patch) => <ReferenceLine key={`patch-${patch.version}`} x={Date.parse(patch.date)}
      stroke="#64748b" strokeOpacity={0.65} strokeDasharray="3 4"
      label={compact ? <PatchLabel patch={patch} width={width} /> : undefined} />),
    ...seasons.map((season) => <ReferenceLine key={season.id} x={Date.parse(season.date)}
      stroke="#a78bfa" strokeOpacity={0.8} strokeDasharray="5 4"
      label={<SeasonLabel season={season} width={width} />} />),
  ];
}

export function PatchEventDetails({ patch, entityId, onClose, id }) {
  if (!patch) return null;
  const changes = entityId ? patch.changes.filter((change) => change.id === entityId) : patch.changes;
  return (
    <section id={id} className={styles.details} aria-label={`Изменения патча ${patch.version}`} aria-live="polite">
      <div className={styles.detailHeading}>
        <a href={`/patch-notes/${encodeURIComponent(patch.version)}`}>Патч {patch.version}</a>
        <span>{eventDateLabel(patch.date)}{patch.nextDate ? ` — до ${eventDateLabel(patch.nextDate)}` : ""}</span>
        <button type="button" className={styles.close} aria-label="Закрыть изменения" onClick={onClose}>×</button>
      </div>
      {changes.map((change) => (
        <div key={change.id} className={styles.detailEntity}>
          <PatchIcon change={change} />
          <div className={styles.detailBody}>
            <div className={styles.entityName}>{change.entityName}<span style={{ color: eventTone(change.changeType).color }}>{eventTone(change.changeType).label}</span></div>
            {change.relation ? <p className={styles.relation}>В текущей сборке{change.relation.patch ? ` (${change.relation.patch})` : ""}. Состав сборки на дату патча неизвестен.</p> : null}
            {change.records.map((record, index) => <div key={index} className={styles.record}>
              {record.changeName ? <strong>{record.changeName}</strong> : null}
              {record.details.map((detail, detailIndex) => <p key={detailIndex}>
                {detail.before != null && detail.after != null
                  ? `${detail.label ? `${detail.label}: ` : ""}${detail.before} → ${detail.after}`
                  : detail.text}
              </p>)}
            </div>)}
          </div>
        </div>
      ))}
      {patch.dateSourceUrl ? <a className={styles.source} href={patch.dateSourceUrl} target="_blank" rel="noreferrer">Дата обновления · CN ↗</a> : null}
    </section>
  );
}
