// ui/src/components/ChampionSearch.jsx
import React, { useMemo, useState } from "react";

/**
 * champions: [{ slug, displayName }]
 * value: string
 * onChange: (value) => void
 * onSelect: (champ) => void
 */
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
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 360,
      }}
    >
      <input
        type="text"
        placeholder="Поиск чемпиона…"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        style={{
          width: "100%",
          padding: "8px 10px",
          borderRadius: 999,
          border: "1px solid rgba(55,65,81,1)",
          background: "rgba(15,23,42,0.9)",
          color: "#e5e7eb",
          fontSize: 13,
          outline: "none",
        }}
      />

      {isOpen && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            maxHeight: 260,
            overflowY: "auto",
            background: "rgba(15,23,42,0.98)",
            borderRadius: 12,
            border: "1px solid rgba(31,41,55,1)",
            zIndex: 20,
          }}
        >
          {filtered.map((champ) => (
            <button
              key={champ.slug}
              type="button"
              onClick={() => {
                onSelect(champ);
                onChange(champ.displayName);
                setIsOpen(false);
              }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "6px 10px",
                border: "none",
                background: "transparent",
                color: "#e5e7eb",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 13 }}>{champ.displayName}</div>
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.6,
                }}
              >
                {champ.slug}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChampionSearch;
