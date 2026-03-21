"use client";

import React from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import MenuHeader from "./MenuHeader";
import styles from "./PageWrapper.module.css";

type Props = {
  showBack?: boolean;
  title: string;
  paragraphs?: string[];
  children: React.ReactNode;
};

export default function PageWrapper({
  showBack = false,
  title,
  paragraphs = [],
  children,
}: Props) {
  const router = useRouter();

  return (
    <div className={styles.wrap}>
      <header className={styles.top}>
        {showBack ? (
          <nav aria-label="Навигация назад" className={styles.backTop}>
            <BackButton onClick={() => router.push("/")} />
          </nav>
        ) : null}

        <MenuHeader title={title} paragraphs={paragraphs} />
      </header>

      <main>{children}</main>
    </div>
  );
}
