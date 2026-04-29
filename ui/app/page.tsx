import WinratesClient from "./winrates/WinratesClient";
import { loadWinratesPageData } from "./winrates/load-winrates-page.js";
import PromoBanner from "@/components/PromoBanner";
import styles from "./page.module.css";

export const revalidate = 60;

export default async function HomePage() {
  const { rowsBySlice, maxRowCount, updatedAt, error: loadError } =
    await loadWinratesPageData("ru_ru", revalidate);
  const error = loadError ? "Не удалось загрузить статистику чемпионов." : null;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>Статистика чемпионов</h1>
        <p className={styles.lead}>
          Здесь собраны ключевые метрики по Wild Rift: винрейты, популярность и
          эффективность чемпионов. Данные обновляются регулярно, чтобы можно было
          быстро понять, что сейчас реально работает в игре.
        </p>
      </section>

      <div className={styles.promoWrap}>
        <PromoBanner />
      </div>

      <WinratesClient
        rowsBySlice={rowsBySlice}
        maxRowCount={maxRowCount}
        error={error}
        updatedAt={updatedAt}
        embedded
      />
    </div>
  );
}
