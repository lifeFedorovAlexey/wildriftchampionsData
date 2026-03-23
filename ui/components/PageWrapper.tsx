"use client";

import React from "react";
import MenuHeader from "./MenuHeader";
import styles from "./PageWrapper.module.css";

type Props = {
  title: string;
  paragraphs?: string[];
  children: React.ReactNode;
};

export default function PageWrapper({
  title,
  paragraphs = [],
  children,
}: Props) {
  return (
    <div className={styles.wrap}>
      <header className={styles.top}>
        <MenuHeader title={title} paragraphs={paragraphs} />
      </header>

      <main>{children}</main>
    </div>
  );
}
