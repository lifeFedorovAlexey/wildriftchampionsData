"use client";

import { useEffect } from "react";

import styles from "./error.module.css";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App route error:", error);
  }, [error]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <span className={styles.eyebrow}>Что-то пошло не так</span>
        <h1 className={styles.title}>Telegram WebView снова решил проверить нашу выдержку.</h1>
        <p className={styles.text}>
          Похоже, страница не смогла нормально загрузиться. Такое иногда случается
          из-за нестабильной встроенной браузерной среды и сетевых ограничений.
        </p>
        <p className={styles.text}>
          Попробуй перезагрузить страницу. Обычно после этого всё открывается как
          надо.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.primaryButton} onClick={() => reset()}>
            Повторить загрузку
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => window.location.reload()}
          >
            Перезагрузить страницу
          </button>
        </div>
      </div>
    </div>
  );
}
