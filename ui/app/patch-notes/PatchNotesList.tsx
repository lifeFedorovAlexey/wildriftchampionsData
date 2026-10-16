"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PatchNoteCard from "./PatchNoteCard";
import type { PatchNoteSummary } from "./patch-notes-lib";
import styles from "./patch-notes.module.css";

export default function PatchNotesList({ initialItems, initialCursor }: {
  initialItems: PatchNoteSummary[];
  initialCursor: string | null;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const request = useRef<AbortController | null>(null);

  const loadMore = useCallback(async () => {
    if (!cursor || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`/api/patch-notes?after=${encodeURIComponent(cursor)}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("Unable to load patch notes");
      const page: { items: PatchNoteSummary[]; nextCursor: string | null } = await response.json();
      setItems((current) => {
        const versions = new Set(current.map((patch) => patch.version));
        return [...current, ...page.items.filter((patch) => !versions.has(patch.version))];
      });
      setCursor(page.nextCursor);
    } catch {
      if (!controller.signal.aborted) setError(true);
    } finally {
      request.current = null;
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [cursor]);

  useEffect(() => () => request.current?.abort(), []);

  useEffect(() => {
    if (!cursor || loading || error || !sentinel.current || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void loadMore();
    }, { rootMargin: "400px" });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [cursor, loading, error, loadMore]);

  return (
    <section className={styles.list} aria-label="Список патчей">
      {items.map((patch, index) => <PatchNoteCard key={patch.version} patch={patch} patchIndex={index} />)}
      {!items.length && <div className={styles.empty}>Патчноуты пока не загружены. Импорт запускается ежедневно.</div>}
      {cursor && (
        <div className={styles.loadMore} ref={sentinel}>
          {error && <p role="alert">Не удалось загрузить следующие патчи. Попробуйте ещё раз.</p>}
          <button type="button" onClick={() => void loadMore()} disabled={loading}>
            {loading ? "Загружаем патчи…" : error ? "Повторить загрузку" : "Загрузить ещё"}
          </button>
          <span className={styles.loadStatus} role="status">{loading ? "Загружаем следующие патчи" : ""}</span>
        </div>
      )}
    </section>
  );
}
