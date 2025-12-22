"use client";

import React from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import MenuHeader from "./MenuHeader";

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
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 12 }}>
      {/* HEADER LINE */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {showBack ? (
          <nav aria-label="Навигация назад">
            <BackButton onClick={() => router.back()} />
          </nav>
        ) : null}

        {/* Header занимает всю ширину */}
        <div style={{ flex: 1 }}>
          <MenuHeader title={title} paragraphs={paragraphs} />
        </div>
      </div>

      {/* PAGE CONTENT */}
      <main>{children}</main>
    </div>
  );
}
