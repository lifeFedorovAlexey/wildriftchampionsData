"use client";

import { useEffect, useRef, useState } from "react";

import { ensureLocalAssetSrc } from "@/lib/asset-safety";

import styles from "./skins.module.css";

export default function ModelViewerComponent({
  modelSrc,
  skinName,
}: {
  modelSrc: string;
  skinName: string;
}) {
  type ModelViewerElement = HTMLElement & {
    availableAnimations?: string[];
    animationName?: string;
    currentTime?: number;
    pause?: () => void;
    play?: () => void;
  };

  const [isLoading, setIsLoading] = useState(true);
  const [isViewerReady, setIsViewerReady] = useState(false);
  const [animationNames, setAnimationNames] = useState<string[]>([]);
  const [currentAnimIndex, setCurrentAnimIndex] = useState(0);
  const modelViewerRef = useRef<ModelViewerElement | null>(null);

  useEffect(() => {
    if (isViewerReady) {
      return;
    }

    let cancelled = false;

    import("@google/model-viewer")
      .then(() => {
        if (!cancelled) {
          setIsViewerReady(true);
        }
      })
      .catch((error) => {
        console.error("Failed to load local model-viewer bundle", error);
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isViewerReady]);

  useEffect(() => {
    setIsLoading(true);
    setAnimationNames([]);
    setCurrentAnimIndex(0);

    const modelViewer = modelViewerRef.current;
    if (!modelViewer || !isViewerReady) {
      return;
    }

    const forcePlay = (name?: string) => {
      try {
        if (name) {
          modelViewer.animationName = name;
        }
        modelViewer.pause?.();
        modelViewer.currentTime = 0;
        modelViewer.play?.();
      } catch (error) {
        console.error("Model animation playback failed", error);
      }
    };

    const onLoad = () => {
      setIsLoading(false);

      const anims = (modelViewer.availableAnimations || [])
        .slice()
        .sort((left: string, right: string) => {
          const isIdleLeft = /^idle/i.test(left);
          const isIdleRight = /^idle/i.test(right);

          if (isIdleLeft && !isIdleRight) return -1;
          if (!isIdleLeft && isIdleRight) return 1;
          return left.localeCompare(right);
        });

      setAnimationNames(anims);

      if (anims.length > 0) {
        setCurrentAnimIndex(0);
        forcePlay(anims[0]);
      }
    };

    const onError = (error: unknown) => {
      console.error("Model loading failed", error);
      setIsLoading(false);
    };

    modelViewer.addEventListener("load", onLoad);
    modelViewer.addEventListener("error", onError);

    return () => {
      modelViewer.removeEventListener("load", onLoad);
      modelViewer.removeEventListener("error", onError);
      modelViewer.pause?.();
    };
  }, [isViewerReady, modelSrc]);

  const applyAnimByIndex = (index: number) => {
    const modelViewer = modelViewerRef.current;
    const name = animationNames[index];

    if (!modelViewer || !name) {
      return;
    }

    setCurrentAnimIndex(index);
    modelViewer.pause?.();
    modelViewer.animationName = name;
    modelViewer.currentTime = 0;
    modelViewer.play?.();
  };

  const nextAnim = () => {
    if (animationNames.length <= 1) return;
    const next = (currentAnimIndex + 1) % animationNames.length;
    applyAnimByIndex(next);
  };

  const prevAnim = () => {
    if (animationNames.length <= 1) return;
    const prev = currentAnimIndex === 0 ? animationNames.length - 1 : currentAnimIndex - 1;
    applyAnimByIndex(prev);
  };

  return (
    <>
      {isLoading ? <div className={styles.loader}>Загрузка 3D модели...</div> : null}

      <div
        style={{
          display: isLoading ? "none" : "block",
          width: "100%",
          height: "80vh",
        }}
      >
        <div style={{ width: "100%", height: "100%" }}>
          <model-viewer
            key={modelSrc}
            ref={modelViewerRef}
            src={ensureLocalAssetSrc("ModelViewerComponent.model", modelSrc) || ""}
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

        {animationNames.length > 1 ? (
          <div className={styles.controls}>
            <button onClick={prevAnim}>←</button>
            <span>{animationNames[currentAnimIndex] || "Default"}</span>
            <button onClick={nextAnim}>→</button>
          </div>
        ) : null}
      </div>
    </>
  );
}
