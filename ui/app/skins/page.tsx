"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageWrapper from "@/components/PageWrapper";
import styles from "./skins.module.css";
import { ChampionSkinsData } from "../types/skin";

export default function SkinsPage() {
  const [champions, setChampions] = useState<ChampionSkinsData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadChampions() {
      try {
        const indexRes = await fetch("/merged/index.json");
        if (!indexRes.ok) throw new Error("Не удалось загрузить index.json");
        const slugs: string[] = await indexRes.json();

        const loaded = await Promise.all(
          slugs.map(async (slug): Promise<ChampionSkinsData | null> => {
            try {
              const res = await fetch(`/merged/${slug}.json`, {
                next: { revalidate: 3600 },
              });
              if (!res.ok) {
                console.warn(`Не удалось загрузить /merged/${slug}.json`);
                return null;
              }
              const data: ChampionSkinsData = await res.json();
              return data;
            } catch (err) {
              console.error(`Ошибка загрузки ${slug}:`, err);
              return null;
            }
          })
        );

        const validChampions = loaded.filter(
          (champ): champ is ChampionSkinsData => champ !== null
        );
        setChampions(validChampions);
      } catch (err) {
        console.error("Ошибка загрузки списка чемпионов:", err);
      } finally {
        setLoading(false);
      }
    }

    loadChampions();
  }, []);

  if (loading) {
    return (
      <PageWrapper title="Скины" paragraphs={["Загрузка..."]}>
        <p>Загружаем чемпионов...</p>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Скины"
      paragraphs={[
        "Просмотр 3D-моделей фанатских скинов чемпионов League of Legends — соответствующих и не совсем версии Wild Rift.",
      ]}
      showBack
    >
      <div className={styles.grid}>
        {champions.length === 0 ? (
          <p>
            Нет данных о скинах. Убедитесь, что папка{" "}
            <code>/public/merged</code> содержит JSON-файлы, включая{" "}
            <code>index.json</code>.
          </p>
        ) : (
          champions.map((champ) => {
            const firstSkin = champ.skins[0];
            const name = champ.slug.toUpperCase();

            return (
              <Link
                key={champ.slug}
                href={`/skins/${champ.slug}`}
                className={styles.tile}
              >
                {firstSkin ? (
                  <img
                    src={firstSkin.image.preview}
                    alt={name}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "12px",
                    }}
                  />
                ) : (
                  <div className={styles.placeholder}>?</div>
                )}
                <div className={styles.overlay}>
                  <span>{name}</span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </PageWrapper>
  );
}
