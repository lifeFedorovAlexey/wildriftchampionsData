import styles from "./YandexPromoBlock.module.css";

const YANDEX_PROMO_URL =
  "https://redirect.appmetrica.yandex.com/serve/678337863170949830?partner_id=831050&appmetrica_js_redirect=0&full=0&clid=14970313&banerid=1314970303&erid=5jtCeReNx12oajxVXELBqPM";
const YANDEX_AD_ERID = "5jtCeReNx12oajxVXELBqPM";

export default function YandexPromoBlock({
  title = "Скачать Яндекс Браузер",
  description = "Установите Яндекс Браузер по партнёрской ссылке, если хотите поддержать проект без прямого доната.",
  ctaLabel = "Открыть ссылку",
}: {
  title?: string;
  description?: string;
  ctaLabel?: string;
}) {
  return (
    <aside className={styles.card} aria-label="Рекламный блок Яндекса">
      <div className={styles.copy}>
        <p className={styles.legal}>Реклама • erid: {YANDEX_AD_ERID}</p>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
        <p className={styles.disclaimer}>Рекламодатель: ООО «Яндекс», ИНН 7736207543</p>
      </div>

      <div className={styles.actions}>
        <a
          className={styles.cta}
          href={YANDEX_PROMO_URL}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
        >
          {ctaLabel}
        </a>
      </div>
    </aside>
  );
}
