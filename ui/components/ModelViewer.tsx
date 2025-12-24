"use client";
import { useEffect, useRef } from "react";
import { Group } from "three";
import { useAnimations } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import {
  Bounds,
  Center,
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

function Model({ url }: { url: string }) {
  const group = useRef<Group>(null);
  const gltf = useGLTF(url);
  const { actions, names } = useAnimations(gltf.animations, group);

  useEffect(() => {
    if (!names || names.length === 0) {
      console.warn("Анимаций нет");
      return;
    }

    const action = actions[names[0]];
    action?.reset().fadeIn(0.2).play();

    return () => {
      action?.fadeOut(0.2);
    };
  }, [actions, names]);

  return (
    <Bounds fit clip observe margin={1.2}>
      <Center>
        <group ref={group}>
          <primitive object={gltf.scene} />
        </group>
      </Center>
    </Bounds>
  );
}

export default function ModelViewer({
  url = "/models/hero.glb",
  height = 800,
}: {
  url?: string;
  height?: number;
}) {
  return (
    <div
      style={{ width: "100%", height, borderRadius: 16, overflow: "hidden" }}
    >
      <Canvas camera={{ fov: 45 }}>
        <Suspense fallback={<Loader />}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[3, 6, 3]} intensity={1.4} />
          <Environment preset="studio" />

          <OrbitControls makeDefault enablePan={false} />

          <Model url={url} />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload("/models/hero.glb");
