"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./skins.module.css";
import dynamic from "next/dynamic";
import { ChampionSkinsData } from "@/app/types/skin";

const ModelViewer = dynamic(() => import("./ModelViewerComponent"), {
  ssr: false,
  loading: () => <p className={styles.loader}>Загрузка 3D-просмотра...</p>,
});

export default function SkinViewer({ data }: { data: ChampionSkinsData }) {
  const [selectedSkinIndex, setSelectedSkinIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const skin = data.skins[selectedSkinIndex];
  const has3d = !!(skin.has3d && skin.model?.cdn);

  const openOverlay = (idx: number) => {
    setSelectedSkinIndex(idx);
    setIsOpen(true);
  };

  const closeOverlay = () => setIsOpen(false);

  // ESC закрывает оверлей
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeOverlay();
    };
    if (isOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  // блокируем скролл страницы, пока открыт оверлей
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
          const canShow3d = !!(s.has3d && s.model?.cdn);

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
                  src={s.image.full}
                  alt={s.name}
                  width={160}
                  height={90}
                  className={styles.thumbImage}
                  loading="lazy"
                />
                <div className={styles.skinName}>{s.name}</div>
                {/* Иконку глаза оставляем. Можно показывать всегда,
                    но если хочешь как раньше — только при canShow3d */}
                {canShow3d && (
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      openOverlay(idx);
                    }}
                    aria-label="Открыть"
                  >
                    👁️
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Оверлей поверх всего */}
      {isOpen && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          onClick={closeOverlay}
        >
          <div
            className={styles.overlayContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.closeButton}
              onClick={closeOverlay}
              aria-label="Закрыть"
            >
              ×
            </button>

            {has3d && skin.model?.cdn ? (
              <ModelViewer modelSrc={skin.model.cdn} skinName={skin.name} />
            ) : (
              <Image
                src={skin.image.full}
                alt={skin.name}
                width={1280}
                height={720}
                className={styles.overlayImage}
                priority
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
