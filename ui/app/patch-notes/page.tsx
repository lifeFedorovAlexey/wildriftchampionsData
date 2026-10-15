import Image from "next/image";
import Link from "next/link";

import PageWrapper from "@/components/PageWrapper";
import { fetchPatchNotes, formatPatchDate } from "./patch-notes-lib";
import styles from "./patch-notes.module.css";

const PREVIEW_TONES = ["new", "buff", "adjustment", "nerf", "removed"] as const;
const PATCH_REVIEW_VIDEO_IDS: Record<string, string> = {
  "7.3b": "dokqvJXyVxk",
  "7.3a": "D5aPsg1QRz8",
  "7.2e": "4eLxDxQzqmU",
  "7.2d": "_sgUtWIMocE",
  "7.2c": "bTpx6oB6HBk",
  "7.2b": "TkD4Xn-2Z2w",
  "7.2a": "p4cnc1JIfLk",
  "7.2": "PZNNpLt2ajg",
  "7.1h": "ZDeBoZPZ40A",
  "7.1g": "uy97TqcbFVw",
  "7.1f": "BgD-oi90llE",
  "7.1e": "3dx7SN3SZgA",
  "7.1d": "yGzyzCxYeXo",
  "7.1b": "1oZ60I39Z_0",
  "7.1": "jsN0c0H7Tls",
  "7.0f": "ugzC0RsR9io",
  "7.0c": "A3eEutsb4zI",
  "7.0a": "xWOUuT7LOE4",
  "6.3f": "qFEsAzpO5Oc",
  "6.3e": "Q4JiMa7Lp58",
  "6.3d": "hghP-HWla1Q",
  "6.3c": "bESD8VP9Tfg",
};

export default async function PatchNotesPage() {
  const items = await fetchPatchNotes();

  return (
    <PageWrapper
      title="Патчноуты Wild Rift"
      paragraphs={[]}
    >
      <section className={styles.list} aria-label="Список патчей">
        {items.length ? items.map((patch) => {
          const videoId = PATCH_REVIEW_VIDEO_IDS[patch.version.toLowerCase()];
          const review = videoId ? {
            url: `https://youtu.be/${videoId}`,
            thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            title: `Обзор обновления ${patch.version} от INQGames`,
          } : null;
          return (
            <article
              key={patch.version}
              className={`${styles.card} ${review ? styles.cardWithVideo : ""}`}
            >
              {review && (
                <a
                  className={styles.videoPreview}
                  href={review.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${review.title} — открыть на YouTube`}
                >
                  <Image src={review.thumbnail} alt={review.title} width={240} height={135} unoptimized />
                  <span className={styles.videoPlay} aria-hidden="true" />
                </a>
              )}
              <Link
                className={styles.cardLink}
                href={`/patch-notes/${encodeURIComponent(patch.version)}`}
                aria-label={`Открыть патч ${patch.version}`}
              >
                <div className={styles.cardMeta}>
                  <span className={styles.version}>ПАТЧ {patch.version}</span>
                  <time dateTime={patch.publishedAt || undefined}>{formatPatchDate(patch.publishedAt)}</time>
                </div>
                <div className={styles.previewGroups}>
                  {PREVIEW_TONES.map((tone) => {
                    const icons = patch.iconPreviews?.[tone] || [];
                    if (!icons.length) return null;
                    const label = tone === "new" ? "Новый объект" : tone === "removed" ? "Удалённый объект" : tone === "buff" ? "Баф" : tone === "nerf" ? "Нерф" : "Изменение";
                    return (
                      <div key={tone} className={styles.previewGroup} role="group" aria-label={label}>
                        {(["champion", "item"] as const).map((entityKind) => {
                          const entityIcons = icons.filter((icon) => icon.entityKind === entityKind);
                          if (!entityIcons.length) return null;
                          return (
                            <div
                              key={entityKind}
                              className={styles.previewEntityGroup}
                              role="group"
                              aria-label={entityKind === "champion" ? "Чемпионы" : "Предметы"}
                            >
                              {entityIcons.map((icon) => (
                                <span
                                  key={`${icon.entityKind}-${icon.entitySlug || icon.entityName}`}
                                  className={`${styles.previewIcon} ${styles[`preview${tone[0].toUpperCase()}${tone.slice(1)}`]}`}
                                  role="img"
                                  aria-label={`${label}: ${icon.entityName}`}
                                >
                                  <Image src={icon.imageUrl} alt="" width={42} height={42} unoptimized />
                                </span>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </Link>
            </article>
          );
        }) : (
          <div className={styles.empty}>Патчноуты пока не загружены. Импорт запускается ежедневно.</div>
        )}
      </section>
    </PageWrapper>
  );
}
