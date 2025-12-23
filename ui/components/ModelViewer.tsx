"use client";

import { Canvas } from "@react-three/fiber";
import {
  Environment,
  Html,
  OrbitControls,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import { Suspense } from "react";

function Loader() {
  const { active, progress, item, loaded, total } = useProgress();

  if (!active) return null;

  return (
    <Html center>
      <div
        style={{
          width: 320,
          padding: 14,
          borderRadius: 14,
          background: "rgba(10,10,12,0.72)",
          border: "1px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(8px)",
          color: "white",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
        }}
      >
        <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 10 }}>
          Грузим модель… {Math.round(progress)}%
        </div>

        <div
          style={{
            height: 10,
            borderRadius: 999,
            background: "rgba(255,255,255,0.10)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              borderRadius: 999,
              background:
                "linear-gradient(90deg, rgba(59,130,246,0.9), rgba(168,85,247,0.9))",
              transition: "width 120ms linear",
            }}
          />
        </div>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
          {loaded}/{total} файлов
          {item ? (
            <span style={{ display: "block", marginTop: 4 }}>{item}</span>
          ) : null}
        </div>
      </div>
    </Html>
  );
}

function LuxModel({ url }: { url: string }) {
  const gltf = useGLTF(url);

  return (
    <group>
      <primitive object={gltf.scene} />
    </group>
  );
}

export default function ModelViewer({
  url = "/models/hero.glb",
  height = 1000,
}: {
  url?: string;
  height?: number;
}) {
  return (
    <div
      style={{ width: "100%", height, borderRadius: 16, overflow: "hidden" }}
    >
      <Canvas camera={{ position: [0.5, 0.7, 2.5], fov: 40 }}>
        <Suspense fallback={<Loader />}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[1, 5, 2]} intensity={1.2} />
          <Environment preset="studio" />

          <LuxModel url={url} />

          <OrbitControls
            enablePan={false}
            minDistance={1.6}
            maxDistance={2.0}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/hero.glb");
