/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import styles from "../../../../../quizzes/quiz.module.css";
export default function Stats() {
  const { id } = useParams<{ id: string }>();
  const [s, setS] = useState<any>();
  const [e, setE] = useState("");
  useEffect(() => {
    fetch(`/api/quizzes/${id}/statistics`)
      .then(async (r) => {
        const p = await r.json();
        if (!r.ok) throw new Error(p.error);
        setS(p.statistics);
      })
      .catch((x) => setE(x.message));
  }, [id]);
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <h1>Статистика квиза</h1>
      </section>
      {e && <p className={styles.error}>{e}</p>}
      {s && (
        <div className={styles.grid}>
          {[
            ["Начато", s.started],
            ["Завершено", s.completed],
            ["Участники", s.uniqueParticipants],
            ["Средний балл", s.averageScore.toFixed(1)],
          ].map(([k, v]) => (
            <div className={styles.card} key={String(k)}>
              <span className={styles.muted}>{k}</span>
              <strong className={styles.stat}>{v}</strong>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
