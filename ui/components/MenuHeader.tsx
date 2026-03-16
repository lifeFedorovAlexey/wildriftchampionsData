"use client";

import React, { useState } from "react";
import { getTelegramWebApp } from "@/lib/telegram-webapp";

type Props = {
  title: string;
  paragraphs?: string[];
  telegramHref?: string;
  telegramLabel?: string;
};

function detectTelegramWebApp(): boolean {
  const wa = getTelegramWebApp();
  if (!wa) return false;

  const hasInitData =
    typeof wa.initData === "string" && wa.initData.trim().length > 0;
  const hasUser = Boolean(wa.initDataUnsafe?.user);

  return hasInitData || hasUser;
}

export default function MenuHeader({
  title,
  paragraphs = [],
  telegramHref = "https://t.me/life_wr_bot",
  telegramLabel = "@life_wr_bot",
}: Props) {
  const [isTelegramWebApp] = useState<boolean>(() => detectTelegramWebApp());

  return (
    <header className="menuHeader">
      <h1 className="title">{title}</h1>

      {paragraphs.length > 0 ? (
        <div className="paragraphs">
          {paragraphs.map((paragraph, idx) => (
            <p key={idx} className="paragraph">
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}

      {!isTelegramWebApp ? (
        <p className="telegramLine">
          Tg:{" "}
          <a
            href={telegramHref}
            target="_blank"
            rel="noopener noreferrer"
            className="telegramLink"
          >
            {telegramLabel}
          </a>
        </p>
      ) : null}

      <style jsx>{`
        .menuHeader {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 10px;
          padding: 4px 8px 2px;
          margin-bottom: 14px;
        }

        .title {
          margin: 0;
          color: #f8fafc;
          font-size: 24px;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.02em;
          text-wrap: balance;
        }

        .paragraphs {
          max-width: 860px;
        }

        .paragraph {
          margin: 0;
          color: rgba(226, 232, 240, 0.92);
          font-size: 13px;
          line-height: 1.5;
        }

        .telegramLine {
          margin: 0;
          color: #f8fafc;
          font-size: 14px;
          font-weight: 700;
          line-height: 1.2;
        }

        .telegramLink {
          color: #a78bfa;
          text-decoration: none;
          font-weight: 700;
        }

        .telegramLink:hover {
          color: #c4b5fd;
        }

        @media (max-width: 640px) {
          .menuHeader {
            gap: 8px;
            margin-bottom: 12px;
          }

          .title {
            font-size: 18px;
          }

          .paragraph {
            font-size: 12px;
          }

          .telegramLine {
            font-size: 13px;
          }
        }
      `}</style>
    </header>
  );
}
