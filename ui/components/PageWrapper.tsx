"use client";

import React from "react";
import MenuHeader from "./MenuHeader";
import styles from "./PageWrapper.module.css";

type Props = {
  title: string;
  paragraphs?: string[];
  topContent?: React.ReactNode;
  children: React.ReactNode;
};

export default function PageWrapper({
  title,
  paragraphs = [],
  topContent = null,
  children,
}: Props) {
  return (
    <div className={styles.wrap}>
      <header className={styles.top}>
        {topContent}
        <MenuHeader title={title} paragraphs={paragraphs} />
      </header>

      <main>{children}</main>
    </div>
  );
}
