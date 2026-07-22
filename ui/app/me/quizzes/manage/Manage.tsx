/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import styles from "../../../quizzes/quiz.module.css";

const EMPTY_DRAFT = {
  title: "",
  description: "",
  shortDescription: "",
  attemptLimitType: "unlimited",
  visibility: "registered",
  version: {
    startQuestionId: null,
    questions: [],
    results: [],
    layout: { nodes: [] },
  },
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Черновик",
  published: "Опубликован",
  unpublished: "Снят с публикации",
  archived: "В архиве",
  blocked: "Заблокирован",
};

export default function Manage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/quizzes?managed=1", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setQuizzes(payload.quizzes || []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "quiz_list_failed");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function create() {
    setCreating(true);
    setError("");
    try {
      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(EMPTY_DRAFT),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      router.push(`/me/quizzes/manage/${payload.quiz.id}/edit`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "quiz_create_failed");
      setCreating(false);
    }
  }

  return <main className={styles.page}>
    <section className={styles.hero}>
      <div className={styles.toolbar}>
        <div>
          <h1>Управление квизами</h1>
          <p className={styles.muted}>Редактор доступен меценатам, стримерам и администраторам.</p>
        </div>
        <button className={styles.button} disabled={creating} onClick={create}>
          {creating ? "Создаём…" : "Создать квиз"}
        </button>
      </div>
    </section>
    {error && <p className={styles.error}>{error}</p>}
    <div className={styles.grid}>
      {quizzes.map((quiz) => <article className={styles.card} key={quiz.id}>
        <span className={styles.badge}>{STATUS_LABELS[quiz.status] || "Неизвестный статус"}</span>
        <h2>{quiz.title || "Без названия"}</h2>
        {quiz.shortDescription && <p className={styles.muted}>{quiz.shortDescription}</p>}
        <div className={styles.actions}>
          <Link className={styles.button} href={`/me/quizzes/manage/${quiz.id}/edit`}>Редактировать</Link>
          <Link className={styles.secondary} href={`/me/quizzes/manage/${quiz.id}/statistics`}>Статистика</Link>
        </div>
      </article>)}
    </div>
  </main>;
}
