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
};

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
        if (!response.ok) throw new Error(payload.error);
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
      if (!response.ok) throw new Error(payload.error);
      router.push(`/quizzes/${id}/play?attempt=${payload.attempt.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "start_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      {error && <p className={styles.error}>{error}</p>}
      {!quiz && !error && <p className={styles.loading}>Загружаем квиз…</p>}
      {quiz && (
        <section className={styles.detailHero}>
          <div className={styles.detailContent}>
            <span className={styles.kicker}>Квиз Wild Rift</span>
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
            </div>
            <button className={styles.primary} disabled={busy} onClick={start}>
              {busy ? "Запускаем…" : "Начать квиз"}
            </button>
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
