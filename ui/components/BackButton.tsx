// src/components/BackButton.tsx
"use client";

import React from "react";

type Props = {
  onClick: () => void;
  title?: string;
};

export default function BackButton({ onClick, title = "Назад" }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title}
      title={title}
      style={{
        width: 40,
        height: 40,
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(15,23,42,0.9)",
        color: "inherit",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M15 18l-6-6 6-6"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
