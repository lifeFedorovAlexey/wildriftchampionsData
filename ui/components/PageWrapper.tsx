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
          max-width: var(--page-max-width);
          margin: 0 auto;
          padding: 14px 14px 20px;
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

        @media (max-width: 640px) {
          .wrap {
            padding: 12px 12px 18px;
          }

          .backTop {
            margin-bottom: 4px;
          }
        }

        @media (min-width: 1024px) {
          .wrap {
            padding-top: 18px;
          }

          .top {
            margin-bottom: 18px;
          }

          .backTop {
            margin-bottom: 8px;
          }
        }
      `}</style>
    </div>
  );
}
