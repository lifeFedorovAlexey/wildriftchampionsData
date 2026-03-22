"use client";

import React, { useMemo, useState } from "react";
import SearchField from "@/components/ui/SearchField";
import styles from "./ChampionSearch.module.css";

export function ChampionSearch({ champions, value, onChange, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return champions.slice(0, 25);

    return champions
      .filter((c) => {
        const name = (c.displayName || "").toLowerCase();
        const slug = (c.slug || "").toLowerCase();
        return name.includes(q) || slug.includes(q);
      })
      .slice(0, 25);
  }, [champions, value]);

  return (
    <div className={styles.shell}>
      <SearchField
        type="text"
        value={value}
        onChange={(nextValue) => {
          onChange(nextValue);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Поиск чемпиона…"
        ariaLabel="Поиск чемпиона"
      />

      {isOpen && filtered.length > 0 ? (
        <div className={styles.dropdown}>
          {filtered.map((champ) => (
            <button
              key={champ.slug}
              type="button"
              onClick={() => {
                onSelect(champ);
                onChange(champ.displayName);
                setIsOpen(false);
              }}
              className={styles.option}
            >
              <div className={styles.name}>{champ.displayName}</div>
              <div className={styles.slug}>{champ.slug}</div>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default ChampionSearch;
