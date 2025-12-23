"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { Suspense } from "react";

type Props = {
  src?: string;
  height?: number;
};

function Model({ src }: { src: string }) {
  const gltf = useGLTF(src);
  return <primitive object={gltf.scene} />;
}

export default function ModelViewer({
  src = "/models/hero.glb",
  height = 520,
}: Props) {
  return (
    <div
      style={{ width: "100%", height, borderRadius: 16, overflow: "hidden" }}
    >
      <Canvas camera={{ position: [0, 1.2, 2.8], fov: 45 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 5, 2]} intensity={1.2} />

          <Model src={src} />

          <Environment preset="studio" />

          {/* Ограничение приближения/отдаления */}
          <OrbitControls
            enablePan={false}
            minDistance={1.6}
            maxDistance={4.0}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Чтобы drei не ругался на типы/кеш:
useGLTF.preload("/models/hero.glb");
