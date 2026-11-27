/**
 * The source dictionary may reuse generic slugs such as "passive" across champions.
 * A lookup by slug is not evidence of identity: require agreement with the displayed ability.
 *
 * @typedef {{ title?: string | null, cost?: string | null, stats?: string[], lines?: string[], imageUrl?: string | null }} Tip
 * @param {{name: string, slug: string, description?: string | null, iconUrl?: string | null}} card
 * @param {{name: string, slug: string, imageUrl?: string | null, tooltip?: Tip | null} | null | undefined} dictionaryEntry
 * @param {(value?: string) => string} repair
 * @returns {{imageUrl?: string | null, tooltip: Tip | null}}
 */
export function resolveGuideAbilityTooltip(card, dictionaryEntry, repair) {
  const normalize = (/** @type {string | null | undefined} */ value) =>
    repair(value ?? "").normalize("NFKC").toLocaleLowerCase("ru-RU").replace(/ё/g, "е").replace(/[^\p{L}\p{N}]/gu, "");
  const name = normalize(card.name);
  const tip = dictionaryEntry?.tooltip;
  const same =
    Boolean(name) &&
    dictionaryEntry?.slug === card.slug &&
    normalize(dictionaryEntry.name) === name &&
    (!tip?.title || normalize(tip.title) === name);

  if (same && tip) return { imageUrl: card.iconUrl || dictionaryEntry?.imageUrl, tooltip: tip };

  // Never re-use a rejected entry's image, cost, stats or text.
  const description = repair(card.description ?? "").trim();
  return {
    imageUrl: card.iconUrl || (same ? dictionaryEntry?.imageUrl : null),
    tooltip: description ? { title: card.name, lines: [description] } : null,
  };
}
