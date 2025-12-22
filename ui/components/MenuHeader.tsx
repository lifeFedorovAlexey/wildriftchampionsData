"use client";

import React, { useEffect, useState } from "react";

type Props = {
  title: string;
  paragraphs?: string[];
  telegramHref?: string;
  telegramLabel?: string;
};

function detectTelegramWebApp(): boolean {
  if (typeof window === "undefined") return false;

  const tg = (window as any)?.Telegram;
  const wa = tg?.WebApp;

  // 1) Должен существовать WebApp
  if (!wa) return false;

  // 2) В реальном TG WebApp обычно есть initData (строка) и/или initDataUnsafe.user
  const hasInitData =
    typeof wa.initData === "string" && wa.initData.trim().length > 0;

  const hasUser = !!wa?.initDataUnsafe?.user;

  return hasInitData || hasUser;
}

export default function MenuHeader({
  title,
  paragraphs = [],
  telegramHref = "https://t.me/life_wr_bot",
  telegramLabel = "@life_wr_bot",
}: Props) {
  const [isTelegramWebApp, setIsTelegramWebApp] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    setIsTelegramWebApp(detectTelegramWebApp());
  }, []);

  return (
    <header
      style={{
        flex: "1 1 auto",
        display: "flex",
        justifyContent: "center",
        textAlign: "center",
        flexDirection: "column",
        marginBottom: "20px",
      }}
    >
      <h1
        style={{
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 0.2,
          margin: 0,
        }}
      >
        {title}
      </h1>

      {paragraphs.length > 0 && (
        <div style={{ marginTop: 8, opacity: 0.92, lineHeight: 1.55 }}>
          {paragraphs.map((p, idx) => (
            <p
              key={idx}
              style={{
                margin: "0 0 8px",
                fontSize: 13,
              }}
            >
              {p}
            </p>
          ))}
        </div>
      )}

      {/* Telegram link — показываем ТОЛЬКО если точно НЕ Telegram */}
      {isTelegramWebApp === false && (
        <p style={{ margin: 0, fontSize: 13 }}>
          Тг:{" "}
          <a
            href={telegramHref}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#a98aff",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            {telegramLabel}
          </a>
        </p>
      )}
    </header>
  );
}
