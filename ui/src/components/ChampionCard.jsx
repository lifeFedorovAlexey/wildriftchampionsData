// ui/src/components/ChampionCard.jsx
import React, { useState } from "react";

export function ChampionCard({ name, slug, image, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        border: "none",
        padding: 0,
        cursor: "pointer",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
      }}
    >
      {/* зона с картинкой + рамкой */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "3 / 4",
          borderRadius: 14,
          overflow: "hidden",
          background: "#050816",
          transform: hovered ? "translateY(-2px) scale(1.03)" : "none",
          boxShadow: hovered
            ? "0 10px 20px rgba(0,0,0,0.6)"
            : "0 4px 10px rgba(0,0,0,0.5)",
          transition: "transform 150ms ease-out, box-shadow 150ms ease-out",
        }}
      >
        {/* картинка чемпиона */}
        <img
          src={image}
          alt={name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.95)",
          }}
        />

        {/* внешняя рамка */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 16,
            border: "2px solid rgba(255,255,255,0.12)",
            boxShadow: "0 0 12px rgba(0,0,0,0.7) inset",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* подпись под картинкой */}
      <div
        style={{
          marginTop: 4,
          fontSize: 12,
          fontWeight: 500,
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {name}
      </div>
    </button>
  );
}
