"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./skins.module.css";

console.log("✅ ModelViewerComponent: загружен (клиент)");

export default function ModelViewerComponent({
  modelSrc,
  skinName,
}: {
  modelSrc: string;
  skinName: string;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [animationNames, setAnimationNames] = useState<string[]>([]);
  const [currentAnimIndex, setCurrentAnimIndex] = useState(0);
  const modelViewerRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    console.log("✅ ModelViewerComponent: useEffect запущен");

    if (scriptLoaded.current) {
      console.log("✅ model-viewer уже загружен — пропускаем");
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src =
      "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";

    script.onload = () => {
      console.log("✅ model-viewer успешно загружен с CDN");
    };

    script.onerror = () => {
      console.error("❌ Ошибка загрузки model-viewer с CDN");
    };

    document.head.appendChild(script);
    scriptLoaded.current = true;

    return () => {
      if (script.parentNode) {
        document.head.removeChild(script);
        console.log("✅ model-viewer script удалён");
      }
    };
  }, []);

  useEffect(() => {
    console.log("✅ ModelViewerComponent: проверка modelSrc", modelSrc);

    setIsLoading(true);
    setAnimationNames([]);
    setCurrentAnimIndex(0);

    const modelViewer = modelViewerRef.current?.querySelector(
      "model-viewer"
    ) as any;

    if (!modelViewer) {
      console.error("❌ model-viewer не найден в DOM");
      return;
    }

    const forcePlay = (name?: string) => {
      try {
        if (name) modelViewer.animationName = name;

        // 🔥 иногда нужно пнуть
        modelViewer.pause?.();
        modelViewer.currentTime = 0;

        // autoplay бывает включен атрибутом, но мы всё равно дернем play()
        modelViewer.play?.();

        console.log("▶️ play() вызван для:", modelViewer.animationName);
      } catch (e) {
        console.error("❌ forcePlay ошибка:", e);
      }
    };

    const onLoad = () => {
      console.log("✅ Модель загружена!");
      setIsLoading(false);

      const anims = (modelViewer.availableAnimations || [])
        .slice()
        .sort((a: string, b: string) => {
          const isIdleA = /^idle/i.test(a);
          const isIdleB = /^idle/i.test(b);

          if (isIdleA && !isIdleB) return -1;
          if (!isIdleA && isIdleB) return 1;
          return a.localeCompare(b);
        });
      console.log("📦 Анимации:", anims);

      setAnimationNames(anims);

      if (anims.length > 0) {
        setCurrentAnimIndex(0);
        forcePlay(anims[0]);
      } else {
        console.log("📭 Нет анимаций — используем по умолчанию");
      }
    };

    const onError = (e: any) => {
      console.error("❌ Ошибка загрузки модели:", e);
      setIsLoading(false);
    };

    modelViewer.addEventListener("load", onLoad);
    modelViewer.addEventListener("error", onError);

    return () => {
      modelViewer.removeEventListener("load", onLoad);
      modelViewer.removeEventListener("error", onError);
      modelViewer.pause?.();
    };
  }, [modelSrc]);

  const applyAnimByIndex = (idx: number) => {
    const modelViewer = modelViewerRef.current?.querySelector(
      "model-viewer"
    ) as any;

    const name = animationNames[idx];
    if (!modelViewer || !name) return;

    setCurrentAnimIndex(idx);

    // та же логика “пнуть”
    modelViewer.pause?.();
    modelViewer.animationName = name;
    modelViewer.currentTime = 0;
    modelViewer.play?.();

    console.log("▶️ Анимация изменена на:", name);
  };

  const nextAnim = () => {
    if (animationNames.length <= 1) return;
    const next = (currentAnimIndex + 1) % animationNames.length;
    applyAnimByIndex(next);
  };

  const prevAnim = () => {
    if (animationNames.length <= 1) return;
    const prev =
      currentAnimIndex === 0 ? animationNames.length - 1 : currentAnimIndex - 1;
    applyAnimByIndex(prev);
  };

  return (
    <>
      {isLoading && (
        <div className={styles.loader}>🌀 Загрузка 3D модели...</div>
      )}

      <div
        style={{
          display: isLoading ? "none" : "block",
          width: "100%",
          height: "80vh",
        }}
      >
        <div ref={modelViewerRef} style={{ width: "100%", height: "100%" }}>
          <model-viewer
            src={modelSrc}
            alt={skinName}
            camera-controls
            shadow-intensity="1"
            style={{
              width: "100%",
              height: "100%",
              background: "#111",
              borderRadius: "12px",
            }}
            autoplay
            animation-crossfade-duration="120"
            ar
            exposure="1.0"
            poster="loading.png"
            loading="eager"
          ></model-viewer>
        </div>

        {animationNames.length > 1 && (
          <div className={styles.controls}>
            <button onClick={prevAnim}>←</button>
            <span>{animationNames[currentAnimIndex] || "Default"}</span>
            <button onClick={nextAnim}>→</button>
          </div>
        )}
      </div>
    </>
  );
}
