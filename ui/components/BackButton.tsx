"use client";

import React from "react";

type Props = {
  onClick: () => void;
  label?: string;
};

export default function BackButton({ onClick, label = "Назад" }: Props) {
  return (
    <>
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={onClick}
        className="backBtn"
      >
        <svg
          width="18"
          height="18"
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

      <style jsx>{`
        .backBtn {
          width: 40px;
          height: 40px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: inherit;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: transform 120ms ease, background 120ms ease,
            border-color 120ms ease;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        .backBtn:active {
          transform: scale(0.96);
        }

        @media (max-width: 520px) {
          .backBtn {
            width: 36px;
            height: 36px;
            border-color: rgba(255, 255, 255, 0.08);
            background: rgba(15, 23, 42, 0.45);
          }
        }
      `}</style>
    </>
  );
}
