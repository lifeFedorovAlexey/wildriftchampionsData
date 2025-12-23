"use client";

import dynamic from "next/dynamic";
import PageWrapper from "@/components/PageWrapper";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), {
  ssr: false,
});

export default function SkinsPage() {
  return (
    <PageWrapper
      title="Скины"
      paragraphs={["Тестируем 3D-просмотр. Пока — Люкс :)"]}
    >
      <div style={{ marginTop: 14 }}>
        <ModelViewer url="/models/hero.glb" height={800} />
      </div>
    </PageWrapper>
  );
}
