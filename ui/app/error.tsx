"use client";

import { useEffect } from "react";

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "24px",
  },
  card: {
    width: "min(560px, 100%)",
    padding: "28px 24px",
    border: "1px solid rgba(132, 192, 238, 0.18)",
    borderRadius: "24px",
    background:
      "radial-gradient(circle at top, rgba(132, 192, 238, 0.12), transparent 36%), rgba(8, 15, 29, 0.9)",
    boxShadow: "0 24px 60px rgba(2, 6, 23, 0.28)",
    textAlign: "center",
  },
  eyebrow: {
    display: "inline-block",
    marginBottom: "10px",
    color: "rgba(184, 220, 245, 0.7)",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
  },
  title: {
    margin: "0 0 14px",
    color: "#f8fafc",
    fontSize: "clamp(24px, 4vw, 34px)",
    lineHeight: 1.08,
    textWrap: "balance",
  },
  text: {
    margin: 0,
    color: "rgba(226, 232, 240, 0.74)",
    fontSize: "14px",
    lineHeight: 1.65,
  },
  secondText: {
    marginTop: "8px",
  },
  actions: {
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "20px",
  },
  buttonBase: {
    minHeight: "42px",
    padding: "0 16px",
    borderRadius: "999px",
    border: "1px solid transparent",
    font: "inherit",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
  },
  primaryButton: {
    color: "#f8fafc",
    background: "linear-gradient(135deg, rgba(132, 192, 238, 0.28), rgba(132, 192, 238, 0.16))",
    borderColor: "rgba(132, 192, 238, 0.28)",
  },
  secondaryButton: {
    color: "rgba(236, 241, 255, 0.84)",
    background: "rgba(255, 255, 255, 0.04)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
} as const;

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
    <div style={styles.page}>
      <style>{`
        @media (max-width: 640px) {
          [data-error-card="true"] {
            padding: 22px 18px !important;
            border-radius: 20px !important;
          }

          [data-error-actions="true"] {
            flex-direction: column !important;
          }

          [data-error-button="true"] {
            width: 100% !important;
          }
        }
      `}</style>
      <div data-error-card="true" style={styles.card}>
        <span style={styles.eyebrow}>Что-то пошло не так</span>
        <h1 style={styles.title}>Telegram WebView снова решил проверить нашу выдержку.</h1>
        <p style={styles.text}>
          Похоже, страница не смогла нормально загрузиться. Такое иногда случается
          из-за нестабильной встроенной браузерной среды и сетевых ограничений.
        </p>
        <p style={{ ...styles.text, ...styles.secondText }}>
          Попробуй перезагрузить страницу. Обычно после этого всё открывается как
          надо.
        </p>
        <div data-error-actions="true" style={styles.actions}>
          <button
            type="button"
            data-error-button="true"
            style={{ ...styles.buttonBase, ...styles.primaryButton }}
            onClick={() => reset()}
          >
            Повторить загрузку
          </button>
          <button
            type="button"
            data-error-button="true"
            style={{ ...styles.buttonBase, ...styles.secondaryButton }}
            onClick={() => window.location.reload()}
          >
            Перезагрузить страницу
          </button>
        </div>
      </div>
    </div>
  );
}
