"use client";

import React from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import MenuHeader from "./MenuHeader";

type Props = {
  showBack?: boolean;
  children: React.ReactNode;
};

export default function PageWrapper({ showBack = false, children }: Props) {
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
        {showBack ? <BackButton onClick={() => router.back()} /> : null}

        {/* MenuHeader занимает всю ширину */}
        <div style={{ flex: 1 }}>
          <MenuHeader />
        </div>
      </div>

      {/* PAGE CONTENT */}
      {children}
    </div>
  );
}
