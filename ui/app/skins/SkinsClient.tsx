"use client";

import Link from "next/link";

import PageWrapper from "@/components/PageWrapper";
import { ensureLocalAssetSrc } from "@/lib/asset-safety";

import type { ChampionSkinsData } from "./skins-lib";
import styles from "./skins.module.css";

export default function SkinsClient({
  champions,
}: {
  champions: ChampionSkinsData[];
}) {
  return (
    <PageWrapper
      title="Скины"
      paragraphs={[
        "Просмотр 3D-моделей фанатских скинов чемпионов League of Legends — соответствующих и не совсем версии Wild Rift.",
      ]}
    >
      <div className={styles.grid}>
        {champions.length === 0 ? (
          <p>Нет данных о скинах. Сначала нужно импортировать скины в WR API.</p>
        ) : (
          champions.map((champ) => {
            const firstSkin = champ.skins[0];
            const name = champ.slug.toUpperCase();

            return (
              <Link key={champ.slug} href={`/skins/${champ.slug}`} className={styles.tile}>
                {firstSkin ? (
                  <img
                    src={ensureLocalAssetSrc("SkinsClient.tile", firstSkin.image.full) || ""}
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
