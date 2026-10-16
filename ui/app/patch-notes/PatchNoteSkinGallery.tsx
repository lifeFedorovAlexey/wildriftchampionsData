import Image from "next/image";

import type { PatchNote } from "./patch-notes-lib";
import styles from "./patch-notes.module.css";

type SkinChange = PatchNote["changes"][number];
type SkinCard = {
  key: string;
  title: string;
  imageUrl: string | null;
  changes: SkinChange[];
  variants: string[];
  hasColorVariants: boolean;
};

const PARENTHETICAL_VARIANT = /^(.+?)\s*\(([^()]+)\)$/;
const ESPORTS_CHROMAS = new Set(["LPL", "LCK", "LEC", "LCS", "LCP", "CBLOL"]);

export default function PatchNoteSkinGallery({ changes }: { changes: SkinChange[] }) {
  const cards = groupSkinChanges(changes);

  return (
    <div className={styles.skinGallery}>
      {cards.map((card) => {
        const isNew = card.changes.some((change) => change.changeType === "new");
        const availability = getSharedAvailability(card);

        return (
          <article className={styles.skinCard} key={card.key}>
            <div className={styles.skinArtwork}>
              {card.imageUrl ? (
                <Image
                  src={card.imageUrl}
                  alt={`${card.title} — изображение облика`}
                  fill
                  sizes="(max-width: 760px) 100vw, 50vw"
                  unoptimized
                />
              ) : (
                <span className={styles.skinArtworkFallback} aria-hidden="true">✦</span>
              )}
              <span className={styles.skinArtworkFrame} aria-hidden="true" />
              <span className={styles.skinArtworkShade} aria-hidden="true" />
              <div className={styles.skinArtworkEyebrow}>
                <span className={styles.skinKind}>СКИН</span>
                {isNew ? <span className={styles.skinNew}>НОВЫЙ</span> : null}
                <span className={styles.skinSeries}>WILD RIFT · КОЛЛЕКЦИЯ</span>
              </div>
              <div className={styles.skinArtworkCaption}>
                <h4>{card.title}</h4>
                {card.hasColorVariants ? (
                  <p>{card.variants.length} {pluralize(card.variants.length, "цветовая схема", "цветовые схемы", "цветовых схем")}</p>
                ) : null}
              </div>
            </div>

            <div className={styles.skinCardBody}>
              {card.hasColorVariants ? (
                <div className={styles.skinVariantBlock}>
                  <span className={styles.skinVariantLabel}>ЦВЕТОВЫЕ СХЕМЫ</span>
                  <div className={styles.skinVariantPreview} aria-label={`Цветовые схемы: ${card.variants.join(", ")}`}>
                    {card.variants.map((variant) => (
                      <span className={styles.skinVariantChip} key={variant}>{variant}</span>
                    ))}
                  </div>
                </div>
              ) : null}
              {availability ? <p className={styles.skinAvailability}>{availability}</p> : null}
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
    const key = normalizeName(baseName);
    const group = candidates.get(key) || [];
    group.push(change);
    candidates.set(key, group);
  }

  const grouped = new Map<SkinChange, SkinChange[]>();
  for (const group of candidates.values()) {
    const colorVariants = group.filter(isColorVariant);
    if (!colorVariants.length) continue;
    for (const change of group) grouped.set(change, group);
  }

  const cards: SkinCard[] = [];
  const seenGroups = new Set<SkinChange[]>();

  for (const change of changes) {
    const group = grouped.get(change);
    if (group && seenGroups.has(group)) continue;
    if (group) seenGroups.add(group);

    const members = group || [change];
    const baseEntry = members.find((entry) => !splitVariantName(entry.entityName).variantName);
    const title = baseEntry?.entityName || splitVariantName(change.entityName).baseName;
    const variantChanges = members.filter(isColorVariant);
    const variants = [...new Set(variantChanges.map((entry) => splitVariantName(entry.entityName).variantName))];
    const imageUrl = baseEntry?.imageUrl || members.find((entry) => entry.imageUrl)?.imageUrl || null;

    cards.push({
      key: members.map((entry) => entry.entitySlug || entry.entityName).join("|") || title,
      title,
      imageUrl,
      changes: members,
      variants,
      hasColorVariants: variants.length > 0,
    });
  }

  return cards;
}

function isColorVariant(change: SkinChange) {
  const { variantName } = splitVariantName(change.entityName);
  if (!variantName) return false;
  if (ESPORTS_CHROMAS.has(variantName.toUpperCase())) return true;
  return change.details.some((detail) => /(?:цвет\w*\s+схем\w*|color\s+scheme|\bchroma\b)/i.test(detail.text));
}

function splitVariantName(value: string) {
  const match = value.trim().match(PARENTHETICAL_VARIANT);
  return match
    ? { baseName: match[1].trim(), variantName: match[2].trim() }
    : { baseName: value.trim(), variantName: "" };
}

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function getSharedAvailability(card: SkinCard) {
  const uniqueNotes = new Map<string, string>();

  for (const change of card.changes) {
    for (const detail of change.details) {
      const note = (detail.label ? `${detail.label}: ` : "") + detail.text;
      const normalizedNote = note.replaceAll(change.entityName, card.title).trim();
      uniqueNotes.set(normalizeName(normalizedNote), normalizedNote);
    }
  }

  return [...uniqueNotes.values()].join(" · ");
}

function pluralize(value: number, one: string, few: string, many: string) {
  const lastTwo = value % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return many;
  const last = value % 10;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}
