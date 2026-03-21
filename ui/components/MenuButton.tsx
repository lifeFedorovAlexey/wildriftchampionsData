"use client";

import type { ReactNode } from "react";
import styles from "./MenuButton.module.css";

type Props = {
  title: string;
  subtitle?: ReactNode;
  href: string;
  gradient?: string;
  rightIcon?: ReactNode;
  leftIcon?: ReactNode;
};

export default function MenuButton({
  title,
  subtitle,
  href,
  gradient,
  rightIcon = "->",
  leftIcon = null,
}: Props) {
  return (
    <a href={href} className={styles.menuButton}>
      <div
        className={styles.menuButtonBg}
        style={{
          background:
            gradient ||
            "linear-gradient(135deg, rgba(56,189,248,0.16), rgba(129,140,248,0.32))",
        }}
      />

      <div className={styles.content}>
        <div className={styles.leftSide}>
          {leftIcon ? <span className={styles.iconShell}>{leftIcon}</span> : null}

          <div className={styles.textBlock}>
            <div className={styles.title}>{title}</div>
            {subtitle ? <div className={styles.subtitle}>{subtitle}</div> : null}
          </div>
        </div>

        <span className={styles.rightIcon}>{rightIcon}</span>
      </div>
    </a>
  );
}
