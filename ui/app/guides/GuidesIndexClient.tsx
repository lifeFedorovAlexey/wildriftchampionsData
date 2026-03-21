"use client";

import { useMemo, useState } from "react";

import styles from "./index.module.css";

type GuideListItem = {
  slug: string;
  name: string;
  title?: string | null;
  iconUrl?: string | null;
  patch?: string | null;
  tier?: string | null;
  roles: string[];
  buildCount: number;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
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
      const haystack = [
        item.name,
        item.title || "",
        item.slug,
        item.roles.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }, [items, query]);

  return (
    <section className={styles.page}>
      <div className={styles.searchWrap}>
        <input
          className={styles.search}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Найти чемпиона или роль"
          aria-label="Поиск по гайдам"
        />
        <div className={styles.meta}>
          {filteredItems.length} из {items.length}
        </div>
      </div>

      <div className={styles.grid}>
        {filteredItems.map((item) => (
          <a key={item.slug} className={styles.card} href={`/guides/${item.slug}`}>
            <div className={styles.cardTop}>
              {item.iconUrl ? (
                <img className={styles.icon} src={item.iconUrl} alt={item.name} />
              ) : (
                <div className={styles.iconFallback}>{item.name.slice(0, 1)}</div>
              )}

              <div className={styles.titleWrap}>
                <h2 className={styles.name}>{item.name}</h2>
                {item.title ? <p className={styles.title}>{item.title}</p> : null}
              </div>
            </div>

            <div className={styles.roleRow}>
              {item.roles.map((role) => (
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
                <span className={styles.statLabel}>Билды</span>
                <strong className={styles.statValue}>{item.buildCount}</strong>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
