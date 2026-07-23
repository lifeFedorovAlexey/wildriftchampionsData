"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import styles from "../experience.module.css";

type Quiz = {
  id: number;
  title: string;
  description?: string;
  shortDescription?: string;
  coverUrl?: string;
  estimatedMinutes?: number;
  attemptLimitType: string;
  attemptLimit?: number;
  status: string;
  currentVersionId?: number | null;
};

function quizErrorMessage(code: string) {
  if (
    code === "quiz_not_available" ||
    code === "quiz_published_version_missing"
  )
    return "Этот квиз ещё не опубликован и пока недоступен для прохождения.";
  if (code === "quiz_not_found") return "Квиз не найден или больше недоступен.";
  return "Не удалось открыть квиз. Попробуй ещё раз.";
}

function attemptLimitLabel(quiz: Quiz) {
  if (quiz.attemptLimitType === "one") return "Одна попытка";
  if (quiz.attemptLimitType === "fixed")
    return `${quiz.attemptLimit || 1} попытки`;
  if (quiz.attemptLimitType === "daily") return "Одна попытка в сутки";
  return "Без ограничения попыток";
}

export default function QuizDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/quizzes/${id}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(quizErrorMessage(payload.error));
        setQuiz(payload.quiz);
      })
      .catch((reason) => setError(reason.message));
  }, [id]);

  async function start() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/quizzes/${id}/attempts`, {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(quizErrorMessage(payload.error));
      router.push(`/quizzes/${id}/play?attempt=${payload.attempt.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "start_failed");
    } finally {
      setBusy(false);
    }
  }

  const isPlayable =
    quiz?.status === "published" && Boolean(quiz.currentVersionId);

  return (
    <main className={styles.page}>
      {error && <p className={styles.error}>{error}</p>}
      {!quiz && !error && <p className={styles.loading}>Загружаем квиз…</p>}
      {quiz && (
        <section className={styles.detailHero}>
          <div className={styles.detailContent}>
            <span className={styles.kicker}>
              {isPlayable ? "Квиз Wild Rift" : "Черновик квиза"}
            </span>
            <h1>{quiz.title}</h1>
            {(quiz.description || quiz.shortDescription) && (
              <p className={styles.description}>
                {quiz.description || quiz.shortDescription}
              </p>
            )}
            <div className={styles.meta}>
              {Number(quiz.estimatedMinutes) > 0 && (
                <span className={styles.metaItem}>
                  ≈ {quiz.estimatedMinutes} мин.
                </span>
              )}
              <span className={styles.metaItem}>{attemptLimitLabel(quiz)}</span>
              {!isPlayable && (
                <span className={styles.metaItem}>Не опубликован</span>
              )}
            </div>
            {isPlayable ? (
              <button className={styles.primary} disabled={busy} onClick={start}>
                {busy ? "Запускаем…" : "Начать квиз"}
              </button>
            ) : (
              <>
                <p className={styles.draftNotice}>
                  Этот квиз виден тебе как автору, но участники не смогут его
                  открыть, пока ты не завершишь настройку и не опубликуешь его.
                </p>
                <button
                  className={styles.primary}
                  onClick={() => router.push(`/me/quizzes/manage/${id}/edit`)}
                >
                  Продолжить редактирование
                </button>
              </>
            )}
          </div>
          <div className={styles.heroVisual}>
            {quiz.coverUrl ? (
              <Image
                src={quiz.coverUrl}
                alt=""
                width={1200}
                height={800}
                sizes="(max-width: 760px) 100vw, 50vw"
                unoptimized
              />
            ) : (
              <div className={styles.heroMark}>
                <span>?</span>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
