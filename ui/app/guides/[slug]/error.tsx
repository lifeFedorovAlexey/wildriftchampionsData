"use client";

import TopPillLink from "@/components/TopPillLink";

export default function GuideError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("Guide page error:", error);

  return (
    <div
      style={{
        minHeight: "calc(100vh - 120px)",
        display: "grid",
        placeItems: "center",
        padding: "32px 20px",
      }}
    >
      <div
        style={{
          width: "min(680px, 100%)",
          borderRadius: "28px",
          border: "1px solid rgba(255, 122, 122, 0.18)",
          background:
            "linear-gradient(180deg, rgba(24, 12, 16, 0.96), rgba(12, 14, 26, 0.96))",
          boxShadow: "0 24px 60px rgba(2, 6, 23, 0.35)",
          padding: "28px 24px",
        }}
      >
        <div style={{ marginBottom: "18px" }}>
          <TopPillLink href="/guides">← К гайдам</TopPillLink>
        </div>
        <p
          style={{
            margin: "0 0 10px",
            color: "rgba(255, 201, 201, 0.78)",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Ошибка загрузки
        </p>
        <h1
          style={{
            margin: "0 0 14px",
            color: "#f8fafc",
            fontSize: "clamp(26px, 4vw, 38px)",
            lineHeight: 1.08,
          }}
        >
          Гайд не загрузился из локального API
        </h1>
        <p
          style={{
            margin: "0 0 10px",
            color: "rgba(226, 232, 240, 0.82)",
            fontSize: "15px",
            lineHeight: 1.65,
          }}
        >
          Это не 404 по чемпиону. Страница не смогла получить данные гайда от `wr-api`.
        </p>
        <p
          style={{
            margin: "0 0 18px",
            color: "rgba(226, 232, 240, 0.66)",
            fontSize: "14px",
            lineHeight: 1.65,
          }}
        >
          Подними локальный API и повтори загрузку. Если он уже запущен, смотри его ответ и прокси
          на `/wr-api/api/guides/[slug]`.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            minHeight: "44px",
            padding: "0 18px",
            borderRadius: "999px",
            border: "1px solid rgba(255, 214, 102, 0.28)",
            background: "linear-gradient(135deg, #f1c766, #d9a84e)",
            color: "#171717",
            font: "inherit",
            fontSize: "14px",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Повторить загрузку
        </button>
      </div>
    </div>
  );
}
