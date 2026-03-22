"use client";

import styles from "./TextHint.module.css";

export default function TextHint({ children }: { children: React.ReactNode }) {
  return <div className={styles.hint}>{children}</div>;
}
