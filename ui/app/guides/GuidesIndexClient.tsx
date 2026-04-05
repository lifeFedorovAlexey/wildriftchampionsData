"use client";

import { useMemo, useState } from "react";
import ChampionAvatar from "@/components/ui/ChampionAvatar";
import SearchField from "@/components/ui/SearchField";

import styles from "./index.module.css";

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
  buildCount: number;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function localizeRole(value?: string | null) {
  const normalized = normalize(String(value || ""));

  if (!normalized) return "";

  if (/^build\s*\d+$/i.test(normalized) || /^guide\s*\d+$/i.test(normalized)) {
    return "";
  }

  if (normalized.includes("support") || normalized.includes("саппорт")) return "Саппорт";
  if (normalized.includes("mid") || normalized.includes("мид")) return "Мид";
  if (normalized.includes("jungle") || normalized.includes("лес")) return "Лес";
  if (normalized.includes("baron") || normalized.includes("топ")) return "Барон";
  if (normalized.includes("solo")) return "Барон";
  if (normalized.includes("duo") || normalized.includes("adc") || normalized.includes("адк")) {
    return "АДК";
  }
  if (normalized.includes("marksman") || normalized.includes("стрелок")) return "Стрелок";
  if (normalized.includes("mage") || normalized.includes("маг")) return "Маг";
  if (normalized.includes("assassin") || normalized.includes("убийца")) return "Убийца";
  if (normalized.includes("tank") || normalized.includes("танк")) return "Танк";
  if (normalized.includes("fighter") || normalized.includes("warrior") || normalized.includes("воин")) {
    return "Воин";
  }

  return String(value || "").trim();
}

function splitRecommendedRoles(value?: string | null) {
  return String(value || "")
    .split("/")
    .map((item) => localizeRole(item))
    .filter(Boolean);
}

function getDisplayRoles(item: GuideListItem) {
  const normalizedRoles = item.roles.map((role) => localizeRole(role)).filter(Boolean);
  if (normalizedRoles.length) {
    return Array.from(new Set(normalizedRoles));
  }

  const fallbackRoles = splitRecommendedRoles(item.recommendedRole);
  if (fallbackRoles.length) {
    return Array.from(new Set(fallbackRoles));
  }

  return [];
}

export default function GuidesIndexClient({
  items,
}: {
  items: GuideListItem[];
}) {
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const needle = normalize(query);
    if (!needle) return items;

    return items.filter((item) => {
      const roles = getDisplayRoles(item);
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
    });
  }, [items, query]);

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
        <div className={styles.meta}>
          {filteredItems.length} из {items.length}
        </div>
      </div>

      <div className={styles.grid}>
        {filteredItems.map((item) => {
          const roles = getDisplayRoles(item);
          const cardClassName = `${styles.card} ${item.hasGuide === false ? styles.cardDisabled : ""}`;

          const content = (
            <>
              <div className={styles.cardTop}>
                <ChampionAvatar
                  name={item.name}
                  src={item.iconUrl}
                  mobileSize={68}
                  desktopSize={68}
                  mobileRadius={16}
                  desktopRadius={16}
                  className={styles.icon}
                  fallbackClassName={styles.iconFallback}
                />

                <div className={styles.titleWrap}>
                  <h2 className={styles.name}>{item.name}</h2>
                  {item.title ? <p className={styles.title}>{item.title}</p> : null}
                </div>
              </div>

              <div className={styles.roleRow}>
                {roles.map((role) => (
                  <span key={`${item.slug}-${role}`} className={styles.roleChip}>
                    {role}
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

                <div className={styles.stat}>
                  <span className={styles.statLabel}>{item.hasGuide === false ? "Статус" : "Билды"}</span>
                  <strong className={styles.statValue}>{item.hasGuide === false ? "Скоро" : item.buildCount}</strong>
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
