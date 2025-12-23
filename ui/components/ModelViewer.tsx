"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import { Suspense } from "react";

function GLB({ src }: { src: string }) {
  const gltf = useGLTF(src);
  return <primitive object={gltf.scene} />;
}

export default function ModelViewer({
  src,
  height = 520,
}: {
  src: string;
  height?: number;
}) {
  return (
    <div
      style={{ width: "100%", height, borderRadius: 16, overflow: "hidden" }}
    >
      <Canvas camera={{ position: [0, 1.2, 2.8], fov: 45 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 5, 2]} intensity={1.2} />
          <GLB src={src} />
          <OrbitControls
            enablePan={false}
            minDistance={2.2}
            maxDistance={3.5}
          />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/hero.glb");
