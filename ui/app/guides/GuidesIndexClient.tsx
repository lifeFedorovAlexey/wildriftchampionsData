"use client";

import { useMemo, useState } from "react";
import LaneFilter, { type LaneKey } from "@/components/LaneFilter";
import ChampionAvatar from "@/components/ui/ChampionAvatar";
import SearchField from "@/components/ui/SearchField";
import guideShared from "@/shared/guides-shared.js";

import styles from "./index.module.css";

const {
  normalizeGuideText,
  toGuideLaneKey,
  localizeGuideLane,
} = guideShared;

type GuideListItem = {
  slug: string;
  name: string;
  localizedName?: string | null;
  hasGuide?: boolean;
  title?: string | null;
  iconUrl?: string | null;
  patch?: string | null;
  tier?: string | null;
  recommendedRole?: string | null;
  roles: string[];
  availableLanes?: LaneKey[];
  laneKeys?: LaneKey[];
  buildCount: number;
};

const normalize = normalizeGuideText;

const LANE_FILTER_OPTIONS: ReadonlyArray<{ key: "all" | LaneKey; label: string }> = [
  { key: "all", label: "Все" },
  { key: "top", label: "Барон" },
  { key: "jungle", label: "Лес" },
  { key: "mid", label: "Мид" },
  { key: "adc", label: "Дракон" },
  { key: "support", label: "Саппорт" },
];

const LANE_SORT_ORDER: Record<string, number> = {
  top: 0,
  jungle: 1,
  mid: 2,
  adc: 3,
  support: 4,
};

const TIER_SORT_ORDER: Record<string, number> = {
  "s+": 0,
  s: 1,
  "a+": 2,
  a: 3,
  "b+": 4,
  b: 5,
  "c+": 6,
  c: 7,
  "d+": 8,
  d: 9,
};

function getLaneKeys(item: GuideListItem): LaneKey[] {
  if (Array.isArray(item.availableLanes) && item.availableLanes.length) {
    return Array.from(new Set(item.availableLanes));
  }

  if (Array.isArray(item.laneKeys) && item.laneKeys.length) {
    return Array.from(new Set(item.laneKeys));
  }

  const directKeys = [
    ...item.roles.map((role) => toGuideLaneKey(role) as LaneKey | null),
    toGuideLaneKey(item.recommendedRole || "") as LaneKey | null,
  ].filter(Boolean) as LaneKey[];

  if (directKeys.length) {
    return Array.from(new Set(directKeys));
  }

  return [];
}

function getPrimaryLaneKey(item: GuideListItem): LaneKey | null {
  return getLaneKeys(item)[0] || null;
}

function getDisplayLanes(item: GuideListItem) {
  const laneLabels = getLaneKeys(item)
    .map((laneKey) => localizeGuideLane(laneKey))
    .filter(Boolean);

  if (laneLabels.length) {
    return Array.from(new Set(laneLabels));
  }

  const fallbackLane = localizeGuideLane(item.recommendedRole || "");
  return fallbackLane ? [fallbackLane] : [];
}

function getTierSortValue(tier?: string | null) {
  const normalized = normalize(String(tier || ""));
  if (!normalized) return 99;
  return TIER_SORT_ORDER[normalized] ?? 50;
}

export default function GuidesIndexClient({
  items,
}: {
  items: GuideListItem[];
}) {
  const [query, setQuery] = useState("");
  const [laneFilter, setLaneFilter] = useState<"all" | LaneKey>("all");

  const filteredItems = useMemo(() => {
    const needle = normalize(query);
    return items
      .filter((item) => {
        const laneKeys = getLaneKeys(item);
        if (laneFilter !== "all" && !laneKeys.includes(laneFilter)) {
          return false;
        }

        if (!needle) {
          return true;
        }

        const roles = getDisplayLanes(item);
        const haystack = [
          item.name,
          item.localizedName || "",
          item.title || "",
          item.slug,
          roles.join(" "),
          item.recommendedRole || "",
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(needle);
      })
      .slice()
      .sort((left, right) => {
        const leftLane = laneFilter === "all" ? getPrimaryLaneKey(left) : laneFilter;
        const rightLane = laneFilter === "all" ? getPrimaryLaneKey(right) : laneFilter;
        const leftLaneOrder = leftLane ? (LANE_SORT_ORDER[leftLane] ?? 99) : 99;
        const rightLaneOrder = rightLane ? (LANE_SORT_ORDER[rightLane] ?? 99) : 99;
        if (leftLaneOrder !== rightLaneOrder) {
          return leftLaneOrder - rightLaneOrder;
        }

        const leftTier = getTierSortValue(left.tier);
        const rightTier = getTierSortValue(right.tier);
        if (leftTier !== rightTier) {
          return leftTier - rightTier;
        }

        if (left.hasGuide !== right.hasGuide) {
          return left.hasGuide ? -1 : 1;
        }

        return (left.localizedName || left.name).localeCompare(right.localizedName || right.name, "ru");
      });
  }, [items, laneFilter, query]);

  return (
    <section className={styles.page}>
      <div className={styles.searchWrap}>
        <SearchField
          className={styles.search}
          value={query}
          onChange={setQuery}
          placeholder="Найти чемпиона или роль"
          ariaLabel="Поиск по гайдам"
        />

        <div className={styles.filtersRow}>
          <LaneFilter
            value={laneFilter}
            onChange={setLaneFilter}
            options={LANE_FILTER_OPTIONS}
          />
        </div>

        <div className={styles.meta}>
          {filteredItems.length} из {items.length}
        </div>
      </div>

      <div className={styles.grid}>
        {filteredItems.map((item) => {
        const lanes = getDisplayLanes(item).slice(0, 2);
        const cardClassName = `${styles.card} ${item.hasGuide === false ? styles.cardDisabled : ""}`;

          const content = (
            <>
              <div className={styles.cardTop}>
                <ChampionAvatar
                  name={item.name}
                  src={item.iconUrl}
                  mobileSize={48}
                  desktopSize={48}
                  mobileRadius={12}
                  desktopRadius={12}
                  className={styles.icon}
                  fallbackClassName={styles.iconFallback}
                />

                <div className={styles.titleWrap}>
                  <h2 className={styles.name}>{item.name}</h2>
                  {item.title ? <p className={styles.title}>{item.title}</p> : null}
                </div>
              </div>

                <div className={styles.cardBottom}>
                  <div className={styles.roleRow}>
                  {lanes.map((lane) => (
                    <span key={`${item.slug}-${lane}`} className={styles.roleChip}>
                      {lane}
                    </span>
                  ))}
                  </div>

                <div className={styles.stats}>
                  {item.patch ? (
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Патч</span>
                      <strong className={styles.statValue}>{item.patch}</strong>
                    </div>
                  ) : null}

                  {item.tier ? (
                    <div className={styles.stat}>
                      <span className={styles.statLabel}>Тир</span>
                      <strong className={styles.statValue}>{item.tier}</strong>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          );

          if (item.hasGuide === false) {
            return (
              <div key={item.slug} className={cardClassName} aria-disabled="true">
                {content}
              </div>
            );
          }

          return (
            <a key={item.slug} className={cardClassName} href={`/guides/${item.slug}`}>
              {content}
            </a>
          );
        })}
      </div>
    </section>
  );
}
