/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "../../quizzes/quiz.module.css";
export default function History() {
  const [a, setA] = useState<any[]>([]);
  const [e, setE] = useState("");
  useEffect(() => {
    fetch("/api/me/quiz-attempts")
      .then(async (r) => {
        const p = await r.json();
        if (!r.ok) throw new Error(p.error);
        setA(p.attempts || []);
      })
      .catch((x) => setE(x.message));
  }, []);
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <h1>Мои квизы</h1>
        <p className={styles.muted}>
          Текущие попытки и сохранённые результаты.
        </p>
      </section>
      {e && <p className={styles.error}>{e}</p>}
      <div className={styles.history}>
        {a.map((x) => (
          <article className={styles.card} key={x.id}>
            <div className={styles.toolbar}>
              <h2>{x.quizTitle}</h2>
              <span className={styles.badge}>{x.status}</span>
            </div>
            <p>
              Попытка №{x.attemptNumber}
              {x.score !== undefined && ` · ${x.score} баллов`}
            </p>
            <Link
              className={styles.button}
              href={`/quizzes/${x.quizId}/play?attempt=${x.id}`}
            >
              {x.status === "in_progress"
                ? "Продолжить"
                : "Посмотреть результат"}
            </Link>
          </article>
        ))}
        {!e && !a.length && (
          <div className={styles.empty}>История пока пуста.</div>
        )}
      </div>
    </main>
  );
}
