"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./catalog.module.css";

type Quiz = {
  id: number;
  title: string;
  shortDescription?: string;
  description?: string;
  coverUrl?: string;
  estimatedMinutes?: number;
};

export default function QuizCatalog() {
  const [items, setItems] = useState<Quiz[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/quizzes", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error);
        setItems(payload.quizzes || []);
      })
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Интерактивные квизы</span>
          <h1>Проверь знание Wild Rift</h1>
          <p className={styles.heroDescription}>
            Проходи квизы сообщества, проверяй игровые знания и сохраняй
            результаты в профиле.
          </p>
        </div>
        <nav className={styles.actions} aria-label="Разделы квизов">
          <Link className={styles.secondary} href="/me/quizzes">
            Мои попытки
          </Link>
          <Link className={styles.secondary} href="/me/quizzes/manage">
            Управление
          </Link>
        </nav>
      </section>

      {error && (
        <p className={styles.error}>
          {error === "unauthorized"
            ? "Войдите, чтобы просматривать и проходить квизы."
            : error}
        </p>
      )}

      <section className={styles.catalog} aria-labelledby="quiz-list-title">
        <header className={styles.sectionHead}>
          <div>
            <h2 id="quiz-list-title">Доступные квизы</h2>
            <p>Выбери испытание и начни прохождение.</p>
          </div>
        </header>

        <div className={styles.grid}>
          {items.map((quiz) => (
            <article className={styles.card} key={quiz.id}>
              <div className={styles.media}>
                {quiz.coverUrl ? (
                  <Image
                    className={styles.cover}
                    src={quiz.coverUrl}
                    alt=""
                    fill
                    sizes="(max-width: 760px) 100vw, 25vw"
                    unoptimized
                  />
                ) : (
                  <div className={styles.placeholder} aria-hidden="true">
                    <span>?</span>
                  </div>
                )}
              </div>
              <div className={styles.cardBody}>
                <span className={styles.meta}>
                  {quiz.estimatedMinutes
                    ? `${quiz.estimatedMinutes} мин.`
                    : "Квиз"}
                </span>
                <h3>{quiz.title}</h3>
                {quiz.shortDescription || quiz.description ? (
                  <p className={styles.description}>
                    {quiz.shortDescription || quiz.description}
                  </p>
                ) : null}
                <Link
                  className={styles.openButton}
                  href={`/quizzes/${quiz.id}`}
                >
                  Открыть квиз
                </Link>
              </div>
            </article>
          ))}
          {!loading && !error && !items.length && (
            <div className={styles.empty}>Опубликованных квизов пока нет.</div>
          )}
        </div>
      </section>
    </main>
  );
}
