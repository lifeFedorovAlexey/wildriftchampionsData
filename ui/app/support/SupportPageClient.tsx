"use client";

import { useState } from "react";
import Image from "next/image";
import PageWrapper from "@/components/PageWrapper";
import StreamerSocials from "@/components/StreamerSocials";
import YandexPromoBlock from "@/components/YandexPromoBlock";
import styles from "./page.module.css";

const CARD_NUMBER = "2200 4002 2031 3577";
const BOOSTY_LINK = "https://boosty.to/lifeonfire/donate";

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
            <h2 className={styles.heroTitle}>
              wildriftallstats.ru
              <span className={styles.heroAccent}> без баннеров и мусора</span>
            </h2>
            <p className={styles.heroText}>
              Если сайт помогает вам следить за метой, собирать билд и быстрее
              находить нужные гайды, можно поддержать проект напрямую на карту
              или через Boosty.
            </p>
            <div className={styles.heroPills}>
              <span className={styles.heroPill}>Без рекламных баннеров</span>
              <span className={styles.heroPill}>Прямая поддержка проекта</span>
              <span className={styles.heroPill}>Партнёрская ссылка только по желанию</span>
            </div>
          </div>

          <div className={styles.supportRail}>
            <div className={styles.supportCard}>
              <div className={styles.cardLabel}>Номер карты</div>
              <div className={styles.cardNumber}>{CARD_NUMBER}</div>
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
              title="Скачать Яндекс с Алисой"
              description="Рекламных блоков на сайте не будет, но если хотите поддержать проект без доната, можно скачать Яндекс с Алисой по этой ссылке. Это тоже вносит вклад в развитие wildriftallstats.ru."
              ctaLabel="Открыть ссылку"
            />
          </div>

          <section className={styles.streamerPanel}>
            <div className={styles.panelHead}>
              <span className={styles.eyebrow}>Поддержка стримера</span>
              <h2 className={styles.panelTitle}>INQ</h2>
            </div>

            <p className={styles.panelText}>
              Актуальные ссылки INQ, которые уже используются на сайте.
            </p>

            <div className={styles.streamerActions}>
              <a href="/tier-inq" className={styles.secondaryLink}>
                Открыть тир-лист INQ
              </a>
            </div>

            <StreamerSocials />
          </section>
        </div>
      </div>
    </PageWrapper>
  );
}
