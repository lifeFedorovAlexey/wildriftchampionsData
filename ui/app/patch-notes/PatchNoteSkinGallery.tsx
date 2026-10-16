import Image from "next/image";

import type { PatchNote } from "./patch-notes-lib";
import styles from "./patch-notes.module.css";

type SkinChange = PatchNote["changes"][number];
type SkinCard = {
  key: string;
  title: string;
  imageUrl: string | null;
  changes: SkinChange[];
};

const PARENTHETICAL_VARIANT = /^(.+?)\s*\(([^()]+)\)$/;

export default function PatchNoteSkinGallery({ changes }: { changes: SkinChange[] }) {
  const cards = groupSkinChanges(changes);

  return (
    <div className={styles.skinGallery}>
      {cards.map((card) => {
        const isNew = card.changes.some((change) => change.changeType === "new");
        const variantNames = card.changes.map((change) => getVariantName(change.entityName, card.title));
        const visibleVariants = variantNames.slice(0, 3);
        const notes = card.changes.flatMap((change) => change.details.map((detail) => ({
          text: detail.label ? `${detail.label}: ${detail.text}` : detail.text,
        })));

        return (
          <article className={styles.skinCard} key={card.key}>
            <div className={styles.skinArtwork}>
              {card.imageUrl ? (
                <Image
                  src={card.imageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 760px) 100vw, 50vw"
                  unoptimized
                />
              ) : (
                <span className={styles.skinArtworkFallback} aria-hidden="true">✦</span>
              )}
              <span className={styles.skinArtworkShade} aria-hidden="true" />
              <div className={styles.skinArtworkCaption}>
                <span className={styles.skinKind}>ОБЛИК</span>
                {isNew ? <span className={styles.skinNew}>НОВЫЙ</span> : null}
                <h4>{card.title}</h4>
              </div>
            </div>

            <div className={styles.skinCardBody}>
              {card.changes.length === 1 ? (
                <p className={styles.skinAvailability}>{notes[0]?.text}</p>
              ) : (
                <>
                  <div className={styles.skinVariantPreview} aria-label={`Вариантов образа: ${card.changes.length}`}>
                    {visibleVariants.map((name, index) => (
                      <span className={styles.skinVariantChip} key={`${name}-${index}`} title={card.changes[index].entityName}>
                        {name}
                      </span>
                    ))}
                    {variantNames.length > visibleVariants.length ? (
                      <span className={styles.skinVariantMore}>+{variantNames.length - visibleVariants.length}</span>
                    ) : null}
                  </div>
                  <details className={styles.skinVariantDetails}>
                    <summary>Все варианты · {card.changes.length}</summary>
                    <ul>
                      {card.changes.map((change, index) => (
                        <li key={`${change.entitySlug || change.entityName}-${change.ordinal}`}>
                          <strong>{variantNames[index]}</strong>
                          {change.details.map((detail, detailIndex) => (
                            <span key={`${detail.label || "detail"}-${detailIndex}`}>
                              {detail.label ? `${detail.label}: ` : ""}{detail.text}
                            </span>
                          ))}
                        </li>
                      ))}
                    </ul>
                  </details>
                </>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function groupSkinChanges(changes: SkinChange[]): SkinCard[] {
  const candidates = new Map<string, SkinChange[]>();

  for (const change of changes) {
    const { baseName } = splitVariantName(change.entityName);
    const key = baseName.toLowerCase();
    const group = candidates.get(key) || [];
    group.push(change);
    candidates.set(key, group);
  }

  const grouped = new Map<SkinChange, SkinChange[]>();
  for (const group of candidates.values()) {
    const imageUrls = new Set(group.flatMap((change) => change.imageUrl ? [change.imageUrl] : []));
    if (group.length < 2 || imageUrls.size > 1 || !group.some((change) => splitVariantName(change.entityName).variantName)) continue;
    for (const change of group) grouped.set(change, group);
  }

  const cards: SkinCard[] = [];
  const seenGroups = new Set<SkinChange[]>();

  for (const change of changes) {
    const group = grouped.get(change);
    if (group && seenGroups.has(group)) continue;
    if (group) seenGroups.add(group);

    const firstName = group?.find((entry) => !splitVariantName(entry.entityName).variantName)?.entityName;
    const title = firstName || splitVariantName(change.entityName).baseName;
    const members = group || [change];
    cards.push({
      key: members.map((entry) => entry.entitySlug || entry.entityName).join("|") || title,
      title,
      imageUrl: members.find((entry) => entry.imageUrl)?.imageUrl || null,
      changes: members,
    });
  }

  return cards;
}

function splitVariantName(value: string) {
  const match = value.trim().match(PARENTHETICAL_VARIANT);
  return match
    ? { baseName: match[1].trim(), variantName: match[2].trim() }
    : { baseName: value.trim(), variantName: "" };
}

function getVariantName(entityName: string, baseName: string) {
  const variantName = splitVariantName(entityName).variantName;
  return variantName || (entityName === baseName ? "Основной" : entityName);
}
