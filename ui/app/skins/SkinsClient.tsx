"use client";

import ModelViewer from "@/components/ModelViewer";

export default function SkinsClient() {
  return (
    <div style={{ marginTop: 14 }}>
      <ModelViewer url="/models/hero.glb" height={820} />
    </div>
  );
}
