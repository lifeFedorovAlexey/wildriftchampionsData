"use client";

import { useEffect, useState } from "react";
import styles from "./VirtualAssistant.module.css";

export default function TypewriterText({ text }: { text: string }) {
  const [visibleLength, setVisibleLength] = useState(0);

  useEffect(() => {
    let interval: number | null = null;
    const startedAt = window.setTimeout(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setVisibleLength(text.length);
        return;
      }
      interval = window.setInterval(() => {
        setVisibleLength((current) => {
          if (current >= text.length) {
            if (interval != null) window.clearInterval(interval);
            return current;
          }
          return current + 1;
        });
      }, 24);
    }, 180);

    return () => {
      window.clearTimeout(startedAt);
      if (interval != null) window.clearInterval(interval);
    };
  }, [text]);

  const complete = visibleLength >= text.length;

  return (
    <span aria-label={text}>
      <span aria-hidden="true">
        {text.slice(0, visibleLength)}
        <span className={`${styles.typeCursor} ${complete ? styles.typeCursorDone : ""}`}>▌</span>
      </span>
    </span>
  );
}
