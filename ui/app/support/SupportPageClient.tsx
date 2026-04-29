"use client";

import { useState } from "react";
import Image from "next/image";
import PageWrapper from "@/components/PageWrapper";
import StreamerSocials from "@/components/StreamerSocials";
import YandexPromoBlock from "@/components/YandexPromoBlock";
import styles from "./page.module.css";

const CARD_NUMBER = "2200 4002 2031 3577";
const CARD_CHUNKS = CARD_NUMBER.split(" ");
const BOOSTY_LINK = "https://boosty.to/lifeonfire/donate";
const OWNER_TELEGRAM_LINK = "https://t.me/fedorov_alexey_tg";

function CopyCardButton() {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(CARD_NUMBER.replace(/\s+/g, ""));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" className={styles.copyButton} onClick={handleClick}>
      {copied ? "Скопировано" : "Скопировать номер"}
    </button>
  );
}

export default function SupportPageClient() {
  return (
    <PageWrapper
      title="Поддержать"
      paragraphs={[
        "Проект живёт без баннеров. Если хотите помочь, это можно сделать напрямую или через партнёрскую ссылку Яндекса.",
      ]}
    >
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroMain}>
            <span className={styles.eyebrow}>Поддержка проекта</span>
            <h2 className={styles.heroTitle}>wildriftallstats.ru</h2>
            <p className={styles.heroLead}>Без баннеров, попапов и рекламной мешанины.</p>
            <p className={styles.heroText}>
              Если сайт помогает вам следить за метой, собирать билд и быстрее
              находить нужные гайды, можно поддержать проект напрямую на карту
              или через Boosty.
            </p>
          </div>

          <div className={styles.supportRail}>
            <div className={styles.supportCard}>
              <div className={styles.cardLabel}>Номер карты</div>
              <div className={styles.cardNumber} aria-label={CARD_NUMBER}>
                {CARD_CHUNKS.map((chunk) => (
                  <span key={chunk} className={styles.cardChunk}>
                    {chunk}
                  </span>
                ))}
              </div>
              <CopyCardButton />
            </div>

            <div className={styles.boostyCard}>
              <div className={styles.cardLabel}>Boosty</div>
              <div className={styles.boostyRow}>
                <a
                  href={BOOSTY_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.boostyLogoLink}
                  aria-label="Открыть Boosty"
                >
                  <Image
                    src="/boosty-logo.svg"
                    alt="Boosty"
                    width={897}
                    height={317}
                    sizes="140px"
                    unoptimized
                  className={styles.boostyLogo}
                />
              </a>

                <a
                  href={BOOSTY_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.qrPanel}
                  aria-label="Открыть Boosty по QR"
                >
                  <Image
                    src="/boosty-donate-qr.png"
                    alt="QR-код для поддержки проекта"
                    width={116}
                    height={116}
                    sizes="116px"
                  className={styles.qrImage}
                />
              </a>
              </div>

              <a
                href={BOOSTY_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.primaryLink}
              >
                Перейти на Boosty
              </a>
            </div>
          </div>
        </section>

        <div className={styles.lowerGrid}>
          <div className={styles.promoWrap}>
            <YandexPromoBlock
              title="Скачать Яндекс Браузер"
              description="Рекламных блоков на сайте не будет, кроме этой страницы поддержки. Если хотите помочь проекту без доната, можно скачать Яндекс Браузер по этой ссылке. Это тоже вносит вклад в развитие wildriftallstats.ru."
              ctaLabel="Открыть ссылку"
            />
          </div>

          <section className={styles.streamerPanel}>
            <div className={styles.panelHead}>
              <span className={styles.eyebrow}>Связь и коллаборация</span>
              <h2 className={styles.panelTitle}>Написать владельцу сайта</h2>
            </div>

            <p className={styles.panelText}>
              Если вы поддерживаете работу сайта и хотите присоединиться,
              предложить идею или обсудить коллаборацию, напишите мне в
              Telegram.
            </p>

            <div className={styles.streamerActions}>
              <a href="/tier-inq" className={styles.secondaryLink}>
                Посмотреть тир-лист INQ
              </a>
              <a
                href={OWNER_TELEGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.secondaryLink}
              >
                Написать в Telegram
              </a>
            </div>

            <StreamerSocials />
          </section>
        </div>
      </div>
    </PageWrapper>
  );
}
