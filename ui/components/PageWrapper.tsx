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
    <div className="wrap">
      <header className="top">
        {showBack ? (
          <nav aria-label="Навигация назад" className="backTop">
            <BackButton onClick={() => router.push("/")} />
          </nav>
        ) : null}

        <MenuHeader title={title} paragraphs={paragraphs} />
      </header>

      <main>{children}</main>

      <style jsx>{`
        .wrap {
          max-width: 900px;
          margin: 0 auto;
          padding: 12px;
        }

        .top {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .backTop {
          display: flex;
          align-items: center;
        }

        /* Мобилка: кнопка слева над заголовком */
        @media (max-width: 520px) {
          .backTop {
            margin-bottom: 4px;
          }
        }

        /* Десктоп: можно слегка отодвинуть */
        @media (min-width: 900px) {
          .backTop {
            margin-bottom: 8px;
          }
        }
      `}</style>
    </div>
  );
}
