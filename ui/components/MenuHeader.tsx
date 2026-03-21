"use client";

import React, { useState } from "react";
import { getTelegramWebApp } from "@/lib/telegram-webapp";
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
  const [isTelegramWebApp] = useState<boolean>(() => detectTelegramWebApp());

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

      {!isTelegramWebApp ? (
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
