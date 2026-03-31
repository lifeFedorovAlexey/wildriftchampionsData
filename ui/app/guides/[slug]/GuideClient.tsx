"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import ChampionAvatar from "@/components/ui/ChampionAvatar";
import { ensureLocalAssetSrc } from "@/lib/asset-safety";

import styles from "./page.module.css";

type EntityTooltip = {
  title?: string | null;
  cost?: string | null;
  stats?: string[];
  lines?: string[];
  imageUrl?: string | null;
};

type GuideEntity = {
  name: string;
  slug: string;
  imageUrl?: string | null;
  lane?: string | null;
  id?: number | null;
  kind?: string | null;
  videoUrl?: string | null;
  tooltip?: EntityTooltip | null;
};

type AbilityContent = {
  name: string;
  slug: string;
  subtitle?: string | null;
  description?: string | null;
  iconUrl?: string | null;
  videoUrl?: string | null;
};

type GuideVariant = {
  guideId: string;
  title: string;
  lane?: string | null;
  tier?: string | null;
  ownTier?: string | null;
  isDefault?: boolean;
  itemBuild: {
    starting: GuideEntity[];
    core: GuideEntity[];
    boots: GuideEntity[];
    finalBuild: GuideEntity[];
  };
  spellsAndRunes: {
    summonerSpells: GuideEntity[];
    runes: GuideEntity[];
  };
  situationalItems: Array<{ label: string; options: GuideEntity[] }>;
  situationalRunes: Array<{ label: string; options: GuideEntity[] }>;
  skillOrder: {
    quickOrder: GuideEntity[];
    rows: Array<{ name: string; slug: string; levels: number[] }>;
  };
  counters: GuideEntity[];
  synergies: GuideEntity[];
};

export type GuideData = {
  champion: {
    name: string;
    slug: string;
    title?: string | null;
    iconUrl?: string | null;
  };
  metadata: {
    patch?: string | null;
    recommendedRole?: string | null;
    tier?: string | null;
    blurb?: string | null;
  };
  availableGuideSlugs?: string[];
  variants?: GuideVariant[];
  buildBreakdown?: {
    featuredItems: GuideEntity[];
    paragraphs: string[];
  } | null;
  official?: {
    champion?: {
      name?: string;
      title?: string;
    };
    roles?: string[];
    difficulty?: string | null;
    heroMedia?: {
      remoteVideoUrl?: string | null;
      localVideoPath?: string | null;
    };
  };
  abilitiesRu?: AbilityContent[];
  dictionaries?: {
    items?: Record<string, GuideEntity>;
    runes?: Record<string, GuideEntity>;
    summonerSpells?: Record<string, GuideEntity>;
    abilities?: Record<string, GuideEntity>;
  };
};

function withTooltip(
  items: GuideEntity[],
  dictionary?: Record<string, GuideEntity>,
): GuideEntity[] {
  return items.map((item) => dictionary?.[item.slug] || item);
}

function normalizeAbilitySlug(value: string) {
  return value.replace(/-(passive|ultimate|\d+)$/i, "");
}

function formatAbilityHotkey(subtitle?: string | null) {
  const normalized = String(subtitle || "").trim().toUpperCase();

  if (normalized === "ПАССИВНОЕ") return "P";
  if (normalized === "1") return "Q";
  if (normalized === "2") return "W";
  if (normalized === "3") return "E";
  if (normalized === "4" || normalized === "АБСОЛЮТНОЕ") return "R";

  return subtitle || "";
}

function localizeLane(value?: string | null) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized.includes("support")) return "Саппорт";
  if (normalized.includes("mid")) return "Мид";
  if (normalized.includes("jungle")) return "Лес";
  if (normalized.includes("baron")) return "Барон";
  if (normalized.includes("duo")) return "Дуо";

  return value || "";
}

function isGenericVariantTitle(value?: string | null) {
  const normalized = String(value || "").trim().toLowerCase();
  return /^build\s*\d+$/i.test(normalized) || /^guide\s*\d+$/i.test(normalized);
}

function localizeVariantTitle(variant: GuideVariant) {
  const lane = localizeLane(variant.lane);
  if (lane) return lane;

  if (isGenericVariantTitle(variant.title)) {
    return "";
  }

  return variant.title
    .replace(/\s+Build$/i, "")
    .replace(/^Support$/i, "Саппорт")
    .replace(/^Mid$/i, "Мид")
    .replace(/^Jungle$/i, "Лес")
    .replace(/^Baron$/i, "Барон")
    .replace(/^Duo$/i, "Дуо");
}

function getVariantRoleLabel(variant?: GuideVariant) {
  if (!variant) return "";

  const lane = localizeLane(variant.lane);
  if (lane) return lane;

  if (isGenericVariantTitle(variant.title)) {
    return "";
  }

  return localizeVariantTitle(variant);
}

function buildOfficialSummary(guide: GuideData, variant?: GuideVariant) {
  const title = guide.champion.title || guide.official?.champion?.title || "";
  const role =
    getVariantRoleLabel(variant) ||
    localizeLane(guide.metadata.recommendedRole) ||
    guide.metadata.recommendedRole ||
    guide.official?.roles?.join(" / ") ||
    "";
  const difficulty = guide.official?.difficulty || "";

  return [
    title ? `${guide.champion.name} — ${title}.` : "",
    role ? `Роль: ${role}.` : "",
    difficulty ? `Сложность освоения: ${difficulty.toLowerCase()}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function localizeSituationalLabel(label: string) {
  const normalized = String(label || "").trim().toLowerCase();

  if (normalized === "vs healing") return "Против лечения";
  if (normalized === "vs critical strike damage") return "Против критического урона";
  if (normalized === "vs attack speed") return "Против скорости атаки";
  if (normalized === "vs ability power") return "Против магического урона";
  if (normalized === "vs poke") return "Против поке";
  if (normalized === "vs crowd control") return "Против контроля";
  if (normalized === "vs burst damage") return "Против взрывного урона";

  return label;
}

function isTranslatedBuildParagraph(value?: string | null) {
  return /[А-Яа-яЁё]/.test(String(value || ""));
}

function HoverTooltip({
  tooltip,
  fallbackName,
}: {
  tooltip?: EntityTooltip | null;
  fallbackName: string;
}) {
  if (!tooltip) return null;

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipTop}>
        {tooltip.imageUrl ? (
          <img
            className={styles.tooltipImage}
            src={ensureLocalAssetSrc("GuideClient.tooltip", tooltip.imageUrl) || ""}
            alt={tooltip.title || fallbackName}
          />
        ) : null}

        <div className={styles.tooltipHead}>
          <div className={styles.tooltipTitle}>{tooltip.title || fallbackName}</div>
          {tooltip.cost ? <div className={styles.tooltipCost}>{tooltip.cost}</div> : null}
        </div>
      </div>

      {tooltip.stats?.length ? (
        <div className={styles.tooltipStats}>
          {tooltip.stats.map((stat) => (
            <div key={stat} className={styles.tooltipStat}>
              {stat}
            </div>
          ))}
        </div>
      ) : null}

      {tooltip.lines?.length ? (
        <div className={styles.tooltipBody}>
          {tooltip.lines.map((line) => (
            <p key={line} className={styles.tooltipLine}>
              {line}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TooltipTrigger({
  tooltip,
  fallbackName,
  children,
}: {
  tooltip?: EntityTooltip | null;
  fallbackName: string;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  if (!tooltip) {
    return <div className={styles.tooltipTrigger}>{children}</div>;
  }

  return (
    <div
      ref={rootRef}
      className={isOpen ? styles.tooltipTriggerActive : styles.tooltipTrigger}
      onClick={() => setIsOpen((value) => !value)}
    >
      {children}
      <HoverTooltip tooltip={tooltip} fallbackName={fallbackName} />
    </div>
  );
}

function OrbCard({
  item,
  compact = false,
}: {
  item: GuideEntity;
  compact?: boolean;
}) {
  return (
    <article className={compact ? styles.orbCardCompact : styles.orbCard}>
      <TooltipTrigger tooltip={item.tooltip} fallbackName={item.name}>
        <div className={styles.orbMediaWrap}>
          {item.imageUrl ? (
            <img
              className={styles.orbMedia}
              src={ensureLocalAssetSrc("GuideClient.orb", item.imageUrl) || ""}
              alt={item.name}
            />
          ) : null}
        </div>
      </TooltipTrigger>
      <div className={styles.orbName}>{item.name}</div>
      {item.lane ? <div className={styles.orbMeta}>{item.lane}</div> : null}
    </article>
  );
}

function BuildPanel({
  title,
  sections,
}: {
  title: string;
  sections: Array<{ label: string; items: GuideEntity[] }>;
}) {
  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>{title}</h2>
      <div className={styles.buildGrid}>
        {sections.map((section) => (
          <div
            key={section.label}
            className={
              section.items.length > 4 ? styles.buildSectionWide : styles.buildSection
            }
          >
            <div className={styles.sectionEyebrow}>{section.label}</div>
            <div className={styles.orbRow}>
              {section.items.map((item) => (
                <OrbCard key={`${section.label}-${item.slug}`} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SkillOrderPanel({
  quickOrder,
  rows,
}: {
  quickOrder: GuideEntity[];
  rows: Array<{ name: string; slug: string; levels: number[] }>;
}) {
  return (
    <section className={styles.panel}>
      <div className={styles.skillTop}>
        <h2 className={styles.panelTitle}>Порядок прокачки</h2>
        <div className={styles.quickOrderRow}>
          <div className={styles.quickLabel}>Быстрый порядок прокачки</div>
          <div className={styles.quickIcons}>
            {quickOrder.map((item, index) => (
              <div key={`${item.slug}-${index}`} className={styles.quickItem}>
                <TooltipTrigger tooltip={item.tooltip} fallbackName={item.name}>
                  <div className={styles.quickOrbWrap}>
                    {item.imageUrl ? (
                      <img
                        className={styles.quickOrb}
                        src={ensureLocalAssetSrc("GuideClient.quickOrb", item.imageUrl) || ""}
                        alt={item.name}
                      />
                    ) : null}
                  </div>
                </TooltipTrigger>
                {index < quickOrder.length - 1 ? (
                  <span className={styles.quickArrow}>{">"}</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.skillRows}>
        {rows.map((row) => (
          <div key={row.slug} className={styles.skillRow}>
            <div className={styles.skillName}>{row.name}</div>
            <div className={styles.skillLevels}>
              {Array.from({ length: 15 }, (_, index) => {
                const level = index + 1;
                const active = row.levels.includes(level);

                return (
                  <span
                    key={`${row.slug}-${level}`}
                    className={active ? styles.skillLevelActive : styles.skillLevel}
                  >
                    {active ? level : ""}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MatchupPanel({
  title,
  items,
  availableGuideSlugs = [],
}: {
  title: string;
  items: GuideEntity[];
  availableGuideSlugs?: string[];
}) {
  const availableSlugSet = new Set(availableGuideSlugs);

  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>{title}</h2>
      <div className={styles.matchupGrid}>
        {items.map((item) => {
          const hasGuide = availableSlugSet.has(item.slug);
          const content = (
            <>
              <ChampionAvatar
                name={item.name}
                src={item.imageUrl}
                shape="circle"
                mobileSize={68}
                desktopSize={84}
                className={styles.matchupImage}
              />
              <div className={styles.matchupName}>{item.name}</div>
              {item.lane ? <div className={styles.matchupMeta}>{item.lane}</div> : null}
            </>
          );

          return hasGuide ? (
            <a key={item.slug} className={styles.matchupCardLink} href={`/guides/${item.slug}`}>
              <article className={styles.matchupCard}>{content}</article>
            </a>
          ) : (
            <article key={item.slug} className={styles.matchupCard}>
              {content}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function SituationalPanel({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; options: GuideEntity[] }>;
}) {
  return (
    <section className={styles.panel}>
      <h2 className={styles.panelTitle}>{title}</h2>
      <div className={styles.situationalRows}>
        {rows.map((row) => (
          <div key={row.label} className={styles.situationalRow}>
            <div className={styles.situationalLabel}>{localizeSituationalLabel(row.label)}</div>
            <div className={styles.situationalItems}>
              {row.options.map((item, index) => (
                <div key={`${row.label}-${item.slug}`} className={styles.situationalItemWrap}>
                  <OrbCard item={item} compact />
                  {index < row.options.length - 1 ? (
                    <span className={styles.situationalArrow}>{">"}</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function GuideClient({ guide }: { guide: GuideData }) {
  const variants = guide.variants?.length ? guide.variants : [];
  const defaultIndex = Math.max(
    0,
    variants.findIndex((variant) => variant.isDefault),
  );
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(defaultIndex);
  const variant = variants[selectedVariantIndex] || variants[0];

  const itemDict = guide.dictionaries?.items;
  const runeDict = guide.dictionaries?.runes;
  const spellDict = guide.dictionaries?.summonerSpells;
  const abilityDict = guide.dictionaries?.abilities;
  const abilities = guide.abilitiesRu ?? [];
  const buildBreakdown = guide.buildBreakdown;
  const buildBreakdownParagraphs =
    buildBreakdown?.paragraphs?.filter((paragraph) => isTranslatedBuildParagraph(paragraph)) ?? [];
  const heroSummary = buildOfficialSummary(guide, variant);
  const heroVideoSrc = guide.official?.heroMedia?.localVideoPath || null;

  const abilityNameBySlug = new Map(
    abilities.map((ability) => [normalizeAbilitySlug(ability.slug), ability.name]),
  );

  const buildSections = variant
    ? [
        {
          label: "Стартовый предмет",
          items: withTooltip(variant.itemBuild.starting, itemDict),
        },
        {
          label: "Основные предметы",
          items: withTooltip(variant.itemBuild.core, itemDict),
        },
        {
          label: "Ботинки",
          items: withTooltip(variant.itemBuild.boots, itemDict),
        },
        {
          label: "Финальный билд",
          items: withTooltip(variant.itemBuild.finalBuild, itemDict),
        },
      ]
    : [];

  const spellSections = variant
    ? [
        {
          label: "Заклинания призывателя",
          items: withTooltip(variant.spellsAndRunes.summonerSpells, spellDict),
        },
        {
          label: "Руны",
          items: withTooltip(variant.spellsAndRunes.runes, runeDict),
        },
      ]
    : [];

  const situationalItems =
    variant?.situationalItems.map((row) => ({
      ...row,
      options: withTooltip(row.options, itemDict),
    })) ?? [];

  const situationalRunes =
    variant?.situationalRunes.map((row) => ({
      ...row,
      options: withTooltip(row.options, runeDict),
    })) ?? [];

  const quickOrder = variant ? withTooltip(variant.skillOrder.quickOrder, abilityDict) : [];
  const skillRows =
    variant?.skillOrder.rows.map((row) => ({
      ...row,
      name: abilityNameBySlug.get(normalizeAbilitySlug(row.slug)) || row.name,
    })) ?? [];

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        {heroVideoSrc ? (
          <div className={styles.heroBackdrop} aria-hidden="true">
            <video
              className={styles.heroBackdropVideo}
              src={heroVideoSrc}
              poster={ensureLocalAssetSrc("GuideClient.heroPoster", guide.champion.iconUrl) || undefined}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          </div>
        ) : null}

        <div className={styles.heroOverlay} aria-hidden="true" />

        <div className={styles.heroContent}>
          <div className={styles.heroMain}>
            {!heroVideoSrc && guide.champion.iconUrl ? (
              <ChampionAvatar
                name={guide.champion.name}
                src={guide.champion.iconUrl}
                mobileSize={88}
                desktopSize={88}
                mobileRadius={22}
                desktopRadius={22}
                className={styles.heroIcon}
              />
            ) : null}

            <div>
              <p className={styles.heroEyebrow}>Гайд по чемпиону</p>
              <h1 className={styles.heroTitle}>{guide.champion.name}</h1>
              {guide.champion.title ? (
                <p className={styles.heroSubtitle}>{guide.champion.title}</p>
              ) : null}
            </div>
          </div>

          {variants.length > 1 ? (
            <div className={styles.variantTabs}>
              {variants.map((item, index) => {
                const active = index === selectedVariantIndex;

                return (
                  <button
                    key={item.guideId}
                    type="button"
                    onClick={() => setSelectedVariantIndex(index)}
                    className={active ? styles.variantTabActive : styles.variantTab}
                  >
                    <span>{localizeVariantTitle(item)}</span>
                    {item.ownTier ? <strong>{item.ownTier}</strong> : null}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className={styles.heroMeta}>
            <div className={styles.metaPill}>
              <span className={styles.metaPillLabel}>Патч</span>
              <span className={styles.metaPillValue}>{guide.metadata.patch ?? "-"}</span>
            </div>
            <div className={styles.metaPill}>
              <span className={styles.metaPillLabel}>Роль</span>
              <span className={styles.metaPillValue}>
                {getVariantRoleLabel(variant) ||
                  localizeLane(guide.metadata.recommendedRole) ||
                  guide.metadata.recommendedRole ||
                  "-"}
              </span>
            </div>
            {guide.official?.difficulty ? (
              <div className={styles.metaPill}>
                <span className={styles.metaPillLabel}>Сложность</span>
                <span className={styles.metaPillValue}>{guide.official.difficulty}</span>
              </div>
            ) : null}
            <div className={styles.metaPill}>
              <span className={styles.metaPillLabel}>Тир</span>
              <span className={styles.metaPillValue}>
                {variant?.ownTier || guide.metadata.tier || "-"}
              </span>
            </div>
          </div>

          {heroSummary ? <p className={styles.heroBlurb}>{heroSummary}</p> : null}
        </div>
      </section>

      <div className={styles.topGrid}>
        <BuildPanel title="Сборка предметов" sections={buildSections} />
        <BuildPanel title="Заклинания и руны" sections={spellSections} />
      </div>

      <div className={styles.middleGrid}>
        <SkillOrderPanel quickOrder={quickOrder} rows={skillRows} />

        <div className={styles.sideStack}>
          <MatchupPanel
            title="Контрпики"
            items={variant?.counters ?? []}
            availableGuideSlugs={guide.availableGuideSlugs}
          />
          <MatchupPanel
            title="Сочетается"
            items={variant?.synergies ?? []}
            availableGuideSlugs={guide.availableGuideSlugs}
          />
        </div>
      </div>

      <div className={styles.topGrid}>
        <SituationalPanel title="Ситуативные предметы" rows={situationalItems} />
        <SituationalPanel title="Ситуативные руны" rows={situationalRunes} />
      </div>

      {buildBreakdown ? (
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Разбор билда</h2>
          <div className={styles.buildGrid}>
            <div className={styles.buildSectionWide}>
              <div className={styles.sectionEyebrow}>Ключевые предметы</div>
              <div className={styles.orbRow}>
                {withTooltip(buildBreakdown.featuredItems, itemDict).map((item) => (
                  <OrbCard key={item.slug} item={item} />
                ))}
              </div>
            </div>
          </div>
          {buildBreakdownParagraphs.length ? (
            <div className={styles.copyStack}>
              {buildBreakdownParagraphs.map((paragraph, index) => (
                <p key={index} className={styles.copyText}>
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {abilities.length ? (
        <section className={styles.panel}>
          <h2 className={styles.panelTitle}>Способности</h2>
          <div className={styles.abilityCards}>
            {abilities.map((ability) => {
              const abilityWithTooltip: Partial<GuideEntity> & AbilityContent = {
                ...(abilityDict?.[ability.slug] || {}),
                ...ability,
              };
              const hotkey = formatAbilityHotkey(ability.subtitle);
              const abilityImageSrc = ability.iconUrl || abilityWithTooltip.imageUrl || null;

              return (
                <article key={ability.slug} className={styles.abilityCard}>
                  <div className={styles.abilityHead}>
                    <TooltipTrigger
                      tooltip={abilityWithTooltip.tooltip}
                      fallbackName={ability.name}
                    >
                      <div className={styles.quickOrbWrap}>
                        {abilityImageSrc ? (
                          <img
                            className={styles.abilityIcon}
                            src={ensureLocalAssetSrc("GuideClient.ability", abilityImageSrc) || ""}
                            alt={ability.name}
                          />
                        ) : null}
                      </div>
                    </TooltipTrigger>
                    <div className={styles.abilityHeading}>
                      <div className={styles.abilityTitle}>{ability.name}</div>
                      {hotkey ? <div className={styles.abilityBadge}>{hotkey}</div> : null}
                    </div>
                  </div>

                  {ability.description ? (
                    <p className={styles.copyText}>{ability.description}</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
