"use client";

import type { ReactNode } from "react";
import styles from "./PillControls.module.css";

export function PillGroup({ children }: { children: ReactNode }) {
  return <div className={styles.group}>{children}</div>;
}

type PillButtonProps = {
  active?: boolean;
  iconOnly?: boolean;
  className?: string;
  children: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function PillButton({
  active = false,
  iconOnly = false,
  className = "",
  children,
  ...props
}: PillButtonProps) {
  const composedClassName = [
    styles.button,
    active ? styles.buttonActive : "",
    iconOnly ? styles.iconButton : "",
    active && iconOnly ? styles.iconButtonActive : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={composedClassName} {...props}>
      {children}
    </button>
  );
}
