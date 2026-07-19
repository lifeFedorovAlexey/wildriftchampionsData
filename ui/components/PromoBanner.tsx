import Image from "next/image";
import { FaHeadset, FaShieldHalved, FaTruckFast } from "react-icons/fa6";
import styles from "./PromoBanner.module.css";

const PROMO_TELEGRAM_URL =
  "https://t.me/+bnbBsEeNj1xkMDJi";

const FEATURES = [
  { label: "Быстрая покупка", icon: FaTruckFast },
  { label: "Безопасные сделки", icon: FaShieldHalved },
  { label: "Поддержка 24/7", icon: FaHeadset },
];

export default function PromoBanner() {
  return (
    <section
      id="d-and-d-shop-banner"
      data-skin-store-banner
      className={styles.banner}
      aria-label="Промо магазина D&D Shop"
    >
      <div className={styles.sheen} aria-hidden="true" />

      <div className={styles.logoWrap}>
        <div className={styles.logoGlow} />
        <Image
          src="/promo-d1.jpg"
          alt="D&D Shop"
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
        {FEATURES.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.label} className={styles.feature}>
              <span className={styles.featureBadge}>
                <Icon className={styles.featureIcon} aria-hidden="true" />
              </span>
              <span>{item.label}</span>
            </li>
          );
        })}
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
