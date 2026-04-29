"use client";

import { useState } from "react";
import Image from "next/image";
import PageWrapper from "@/components/PageWrapper";
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
        "Здесь собраны прямые и аккуратные способы поддержать работу сайта.",
      ]}
    >
      <div className={styles.page}>
        <section className={styles.intro}>
          <h2 className={styles.introTitle}>wildriftallstats.ru</h2>
          <p className={styles.introLead}>Без баннеров, попапов и рекламной мешанины.</p>
          <p className={styles.introText}>
            Если сайт помогает вам следить за метой, собирать билд и быстрее
            находить нужные гайды, можно помочь напрямую картой, через Boosty
            или по партнёрской ссылке на этой странице.
          </p>
          <p className={styles.introNote}>
            Рекламных блоков на сайте не будет. Исключение только одно:
            партнёрская ссылка Яндекса здесь, на странице поддержки.
          </p>
        </section>

        <div className={styles.cardsGrid}>
          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h3 className={styles.cardTitle}>Поддержка картой</h3>
              <p className={styles.cardText}>
                Самый прямой способ помочь работе сайта без посредников.
              </p>
            </div>

            <div className={styles.cardNumber} aria-label={CARD_NUMBER}>
              {CARD_CHUNKS.map((chunk) => (
                <span key={chunk} className={styles.cardChunk}>
                  {chunk}
                </span>
              ))}
            </div>

            <CopyCardButton />
          </section>

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h3 className={styles.cardTitle}>Boosty</h3>
              <p className={styles.cardText}>
                Если удобнее открыть донат через сервис, используйте Boosty или QR-код.
              </p>
            </div>

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
          </section>

          <YandexPromoBlock
            title="Скачать Яндекс Браузер"
            description="Если хотите помочь проекту без доната, можно скачать Яндекс Браузер по этой ссылке. Это тоже поддерживает развитие wildriftallstats.ru."
            ctaLabel="Открыть ссылку"
          />

          <section className={styles.card}>
            <div className={styles.cardHead}>
              <h3 className={styles.cardTitle}>Связь и коллаборация</h3>
              <p className={styles.cardText}>
                Если хотите предложить идею, помочь проекту или обсудить
                коллаборацию, напишите мне в Telegram.
              </p>
            </div>

            <div className={styles.collabFoot}>
              <p className={styles.collabMeta}>Telegram: @fedorov_alexey_tg</p>
              <a
                href={OWNER_TELEGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.secondaryLink}
              >
                Написать в Telegram
              </a>
            </div>
          </section>
        </div>
      </div>
    </PageWrapper>
  );
}
