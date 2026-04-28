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
        "Здесь собраны все способы поддержать развитие wildriftallstats.ru и отдельно поддержать автора тир-листа INQ.",
      ]}
    >
      <div className={styles.page}>
        <section className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Поддержка проекта</span>
            <h2 className={styles.heroTitle}>wildriftallstats.ru</h2>
            <p className={styles.heroText}>
              Если сайт помогает вам следить за метой, собирать билд и быстрее
              находить нужные гайды, поддержку можно отправить напрямую на карту
              или через Boosty.
            </p>
          </div>

          <div className={styles.cardPanel}>
            <div className={styles.cardLabel}>Номер карты</div>
            <div className={styles.cardNumber}>{CARD_NUMBER}</div>
            <CopyCardButton />
          </div>
        </section>

        <div className={styles.grid}>
          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <span className={styles.eyebrow}>Способ 1</span>
              <h2 className={styles.panelTitle}>Поддержка через Boosty</h2>
            </div>

            <p className={styles.panelText}>
              Удобный вариант, если хотите поддержать проект донатом, не вводя
              реквизиты карты вручную.
            </p>

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

          <section className={styles.panel}>
            <div className={styles.panelHead}>
              <span className={styles.eyebrow}>Способ 2</span>
              <h2 className={styles.panelTitle}>Поддержка через карту</h2>
            </div>

            <p className={styles.panelText}>
              Если удобнее поддержать напрямую, используйте номер карты ниже.
            </p>

            <div className={styles.inlineCardBox}>
              <div className={styles.inlineCardNumber}>{CARD_NUMBER}</div>
              <CopyCardButton />
            </div>
          </section>
        </div>

        <YandexPromoBlock
          title="Скачать Яндекс с Алисой"
          description="Партнёрская ссылка Яндекса с маркировкой. Откроет установку приложения Яндекс с Алисой."
          ctaLabel="Открыть ссылку"
        />

        <section className={styles.streamerPanel}>
          <div className={styles.panelHead}>
            <span className={styles.eyebrow}>Поддержка стримера</span>
            <h2 className={styles.panelTitle}>INQ</h2>
          </div>

          <p className={styles.panelText}>
            Отдельно можно поддержать автора кастомного тир-листа и следить за
            его контентом. Ниже собраны актуальные ссылки INQ, которые уже
            используются на сайте.
          </p>

          <div className={styles.streamerActions}>
            <a href="/tier-inq" className={styles.secondaryLink}>
              Открыть тир-лист INQ
            </a>
          </div>

          <StreamerSocials />
        </section>
      </div>
    </PageWrapper>
  );
}
