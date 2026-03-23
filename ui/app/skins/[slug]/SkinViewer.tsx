"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";

import { ensureLocalAssetSrc } from "@/lib/asset-safety";

import type { ChampionSkinsData } from "../skins-lib";
import styles from "./skins.module.css";

const ModelViewer = dynamic(() => import("./ModelViewerComponent"), {
  ssr: false,
  loading: () => <p className={styles.loader}>Р—Р°РіСЂСѓР·РєР° 3D-РїСЂРѕСЃРјРѕС‚СЂР°...</p>,
});

export default function SkinViewer({ data }: { data: ChampionSkinsData }) {
  const [selectedSkinIndex, setSelectedSkinIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const skin = data.skins[selectedSkinIndex];
  const normalizedModelSrc = ensureLocalAssetSrc("SkinViewer.model", skin.model?.cdn);
  const normalizedImageSrc = ensureLocalAssetSrc("SkinViewer.image", skin.image.full);
  const has3d = !!(skin.has3d && normalizedModelSrc);

  const openOverlay = (idx: number) => {
    setSelectedSkinIndex(idx);
    setIsOpen(true);
  };

  const closeOverlay = () => setIsOpen(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeOverlay();
    };

    if (isOpen) {
      window.addEventListener("keydown", onKeyDown);
    }

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>{data.slug.toUpperCase()}</h1>

      <div className={styles.skinList}>
        {data.skins.map((s, idx) => {
          const imageSrc = ensureLocalAssetSrc("SkinViewer.thumb", s.image.full);
          const canShow3d = !!(
            s.has3d && ensureLocalAssetSrc("SkinViewer.thumbModel", s.model?.cdn)
          );

          return (
            <div key={idx} className={styles.skinItem}>
              <div
                className={styles.imageWrapper}
                onClick={() => openOverlay(idx)}
                style={{
                  borderColor: selectedSkinIndex === idx ? "#6366f1" : "#333",
                  cursor: "pointer",
                }}
              >
                <Image
                  src={imageSrc || "/og.png"}
                  alt={s.name}
                  width={160}
                  height={90}
                  className={styles.thumbImage}
                  loading="lazy"
                />
                <div className={styles.skinName}>{s.name}</div>
                {canShow3d ? (
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      openOverlay(idx);
                    }}
                    aria-label="РћС‚РєСЂС‹С‚СЊ"
                  >
                    рџ‘ЃпёЏ
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {isOpen ? (
        <div className={styles.overlay} role="dialog" aria-modal="true" onClick={closeOverlay}>
          <div className={styles.overlayContent} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.closeButton}
              onClick={closeOverlay}
              aria-label="Р—Р°РєСЂС‹С‚СЊ"
            >
              Г—
            </button>

            {has3d && normalizedModelSrc ? (
              <ModelViewer modelSrc={normalizedModelSrc} skinName={skin.name} />
            ) : (
              <Image
                src={normalizedImageSrc || "/og.png"}
                alt={skin.name}
                width={1280}
                height={720}
                className={styles.overlayImage}
                priority
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
