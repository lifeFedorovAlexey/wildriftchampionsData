/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import styles from "../../experience.module.css";

type Attempt = {
  id: number;
  status: string;
  question: any;
  progress: { answered: number; total?: number; percent?: number };
  result?: any;
  score?: number;
  correctCount?: number;
  incorrectCount?: number;
};

const optionQuestionTypes = new Set([
  "single_choice",
  "multiple_choice",
  "yes_no",
]);

function imageUrl(media: any) {
  if (typeof media === "string") return media;
  return media?.url || media?.imageUrl || null;
}

export default function QuizPlayer() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [number, setNumber] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const attemptId = searchParams.get("attempt");

  useEffect(() => {
    if (!attemptId) return;
    fetch(`/api/quiz-attempts/${attemptId}`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error);
        setAttempt(payload.attempt);
      })
      .catch((reason) => setError(reason.message));
  }, [attemptId]);

  async function answer() {
    if (!attempt?.question) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/quiz-attempts/${attempt.id}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: crypto.randomUUID(),
          questionId: attempt.question.id,
          selectedOptionIds: selected,
          textValue: text.trim() || null,
          numberValue: number === "" ? null : Number(number),
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setAttempt(payload.attempt);
      setSelected([]);
      setText("");
      setNumber("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "answer_failed");
    } finally {
      setBusy(false);
    }
  }

  if (!attemptId)
    return (
      <main className={styles.page}>
        <p className={styles.error}>Не указана попытка.</p>
      </main>
    );
  if (!attempt && !error)
    return (
      <main className={styles.page}>
        <p className={styles.loading}>Загружаем вопрос…</p>
      </main>
    );

  if (attempt?.status === "completed" && attempt.result) {
    return (
      <main className={styles.page}>
        <section className={styles.resultShell}>
          {attempt.result.imageUrl && (
            <Image
              className={styles.resultMedia}
              src={attempt.result.imageUrl}
              alt=""
              width={1200}
              height={800}
              sizes="(max-width: 760px) 100vw, 60vw"
              unoptimized
            />
          )}
          <div className={styles.resultBody}>
            <span className={styles.resultLabel}>Результат квиза</span>
            <h1>{attempt.result.title}</h1>
            {attempt.result.description && (
              <p className={styles.resultDescription}>
                {attempt.result.description}
              </p>
            )}
            <div className={styles.resultStats}>
              <div className={styles.resultStat}>
                <strong>{attempt.score || 0}</strong>
                <span>баллов</span>
              </div>
              <div className={styles.resultStat}>
                <strong>{attempt.correctCount || 0}</strong>
                <span>правильных</span>
              </div>
              <div className={styles.resultStat}>
                <strong>{attempt.incorrectCount || 0}</strong>
                <span>ошибок</span>
              </div>
            </div>
            <div className={styles.resultActions}>
              <button
                className={styles.primary}
                onClick={() => router.push(`/quizzes/${id}`)}
              >
                Пройти ещё раз
              </button>
              <button
                className={styles.secondary}
                onClick={() => router.push("/me/quizzes")}
              >
                Мои результаты
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const question = attempt?.question;
  if (!question)
    return (
      <main className={styles.page}>
        {error && <p className={styles.error}>{error}</p>}
      </main>
    );
  const questionImage = imageUrl(question.media?.[0]);
  const isMultiple = question.type === "multiple_choice";
  const needsOption = optionQuestionTypes.has(question.type);
  const needsText = question.type === "text";
  const needsNumber = question.type === "number" || question.type === "scale";
  const canContinue =
    !question.isRequired ||
    (!needsOption && !needsText && !needsNumber) ||
    (needsOption && selected.length > 0) ||
    (needsText && text.trim().length > 0) ||
    (needsNumber && number !== "");
  const answered = attempt?.progress?.answered || 0;
  const total = attempt?.progress?.total;
  const progress =
    attempt?.progress?.percent ??
    (total ? Math.round((answered / total) * 100) : 0);

  function toggleOption(optionId: string) {
    setSelected((current) =>
      isMultiple
        ? current.includes(optionId)
          ? current.filter((item) => item !== optionId)
          : [...current, optionId]
        : [optionId],
    );
  }

  return (
    <main className={styles.page}>
      {error && <p className={styles.error}>{error}</p>}
      <section className={styles.playerShell}>
        <header className={styles.playerTop}>
          <span className={styles.kicker}>Квиз Wild Rift</span>
          <span className={styles.progressCopy}>
            {total
              ? `${Math.min(answered + 1, total)} из ${total}`
              : `Шаг ${answered + 1}`}
          </span>
          <div className={styles.progress}>
            <span style={{ width: `${Math.max(4, progress)}%` }} />
          </div>
        </header>
        <div className={styles.questionBody}>
          {questionImage && (
            <Image
              className={styles.questionMedia}
              src={questionImage}
              alt=""
              width={1200}
              height={800}
              sizes="(max-width: 760px) 100vw, 60vw"
              unoptimized
            />
          )}
          <span className={styles.questionIndex}>
            {question.type === "information"
              ? "Информация"
              : `Вопрос ${answered + 1}`}
          </span>
          <h1>{question.title}</h1>
          {question.description && (
            <p className={styles.questionDescription}>{question.description}</p>
          )}

          {needsOption && (
            <div className={styles.options}>
              {(question.options || []).map((option: any) => {
                const active = selected.includes(option.id);
                return (
                  <label
                    className={`${styles.option} ${active ? styles.optionSelected : ""}`}
                    key={option.id}
                  >
                    <input
                      type={isMultiple ? "checkbox" : "radio"}
                      name={`question-${question.id}`}
                      checked={active}
                      onChange={() => toggleOption(option.id)}
                    />
                    <span className={styles.optionMark} />
                    <span className={styles.optionText}>{option.text}</span>
                    {option.imageUrl && (
                      <Image
                        className={styles.optionImage}
                        src={option.imageUrl}
                        alt=""
                        width={160}
                        height={120}
                        unoptimized
                      />
                    )}
                  </label>
                );
              })}
            </div>
          )}

          {needsText && (
            <label className={styles.answerField}>
              Ваш ответ
              <textarea
                className={styles.textarea}
                value={text}
                onChange={(event) => setText(event.target.value)}
              />
            </label>
          )}
          {needsNumber && (
            <label className={styles.answerField}>
              Ваш ответ
              <input
                className={styles.input}
                type="number"
                value={number}
                onChange={(event) => setNumber(event.target.value)}
              />
            </label>
          )}

          <div className={styles.playerActions}>
            <button
              className={styles.primary}
              disabled={busy || !canContinue}
              onClick={answer}
            >
              {busy
                ? "Сохраняем…"
                : question.type === "information"
                  ? "Продолжить"
                  : "Ответить"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
