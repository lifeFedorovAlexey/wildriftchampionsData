"use client";

import React, { useEffect, useState } from "react";
import {
  getTelegramWebApp,
  TELEGRAM_WEBAPP_READY_EVENT,
} from "@/lib/telegram-webapp";
import styles from "./MenuHeader.module.css";

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
  const [isTelegramWebApp, setIsTelegramWebApp] = useState<boolean | null>(null);

  useEffect(() => {
    const syncTelegramState = () => {
      setIsTelegramWebApp(detectTelegramWebApp());
    };

    syncTelegramState();
    window.addEventListener(TELEGRAM_WEBAPP_READY_EVENT, syncTelegramState);

    return () => {
      window.removeEventListener(
        TELEGRAM_WEBAPP_READY_EVENT,
        syncTelegramState
      );
    };
  }, []);

  return (
    <header className={styles.menuHeader}>
      <h1 className={styles.title}>{title}</h1>

      {paragraphs.length > 0 ? (
        <div className={styles.paragraphs}>
          {paragraphs.map((paragraph, idx) => (
            <p key={idx} className={styles.paragraph}>
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}

      {isTelegramWebApp === false ? (
        <p className={styles.telegramLine}>
          Tg:{" "}
          <a
            href={telegramHref}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.telegramLink}
          >
            {telegramLabel}
          </a>
        </p>
      ) : null}
    </header>
  );
}
