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
          border: 1px solid var(--border-strong);
          background: linear-gradient(
            180deg,
            rgba(17, 24, 39, 0.96),
            rgba(15, 23, 42, 0.8)
          );
          box-shadow: var(--panel-shadow);
          color: var(--text-strong);
          display: grid;
          place-items: center;
          cursor: pointer;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        .backBtn:hover {
          transform: translateY(-1px);
          border-color: rgba(125, 211, 252, 0.35);
        }

        .backBtn:active {
          transform: scale(0.97);
        }

        @media (max-width: 640px) {
          .backBtn {
            width: 36px;
            height: 36px;
            box-shadow: none;
          }
        }
      `}</style>
    </>
  );
}
