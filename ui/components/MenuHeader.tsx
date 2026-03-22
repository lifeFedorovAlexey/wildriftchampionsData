"use client";

import React from "react";
import styles from "./MenuHeader.module.css";

type Props = {
  title: string;
  paragraphs?: string[];
};

export default function MenuHeader({
  title,
  paragraphs = [],
}: Props) {
  return (
    <header className={styles.menuHeader}>
      <h1 className={styles.title}>{title}</h1>

      {paragraphs.length > 0 ? (
        <div className={styles.paragraphs}>
          {paragraphs.map((paragraph, idx) => (
            <p key={idx} className={styles.paragraph}>
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}
    </header>
  );
}
