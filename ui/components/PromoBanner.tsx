import Image from "next/image";
import styles from "./PromoBanner.module.css";

const PROMO_TELEGRAM_URL =
  "https://t.me/ddseller00?text=%D0%9F%D1%80%D0%B8%D1%88%D0%B5%D0%BB%20%D1%81%20%D1%81%D0%B0%D0%B9%D1%82%D0%B0%20wildriftallstats";

function DeliveryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.featureIcon}>
      <path
        d="M4.5 7.5h9v6h-9Zm10 1.5h2.2l2.8 3v1.5h-5Zm-9 6h3m2.5 0H13m1.5 0h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="16.5" r="1.4" fill="currentColor" />
      <circle cx="17.5" cy="16.5" r="1.4" fill="currentColor" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.featureIcon}>
      <path
        d="M12 3.8 18 6v5.2c0 4.1-2.5 6.8-6 8-3.5-1.2-6-3.9-6-8V6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m9.3 11.9 1.7 1.7 3.7-3.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.featureIcon}>
      <path
        d="M7.5 10.5a4.5 4.5 0 1 1 9 0v4.3a2 2 0 0 1-2 2h-1.2M7.5 10.5H6a1.5 1.5 0 0 0-1.5 1.5v1a1.5 1.5 0 0 0 1.5 1.5h1.5Zm9 0H18a1.5 1.5 0 0 1 1.5 1.5v1A1.5 1.5 0 0 1 18 14.5h-1.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 18h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const FEATURES = [
  { label: "Быстрая покупка", icon: <DeliveryIcon /> },
  { label: "Безопасные сделки", icon: <ShieldIcon /> },
  { label: "Поддержка 24/7", icon: <SupportIcon /> },
];

export default function PromoBanner() {
  return (
    <section className={styles.banner} aria-label="Промо магазина Wild Cores">
      <div className={styles.sheen} aria-hidden="true" />

      <div className={styles.logoWrap}>
        <div className={styles.logoGlow} />
        <Image
          src="/promo-d1.jpg"
          alt="D1D shop"
          width={640}
          height={640}
          sizes="(max-width: 768px) 140px, 180px"
          className={styles.logo}
          priority={false}
          unoptimized
        />
      </div>

      <div className={styles.copy}>
        <p className={styles.kicker}>Партнёрский магазин</p>
        <h2 className={styles.title}>
          <span className={styles.titleAccent}>Лучшие цены</span>
          <span className={styles.titleMain}>на Wild Cores</span>
        </h2>
      </div>

      <ul className={styles.features} aria-label="Преимущества магазина">
        {FEATURES.map((item) => (
          <li key={item.label} className={styles.feature}>
            <span className={styles.featureBadge}>{item.icon}</span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>

      <div className={styles.actions}>
        <a
          href={PROMO_TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.cta}
        >
          Перейти в магазин
        </a>
      </div>
    </section>
  );
}
