import Image from "next/image";
import Link from "next/link";
import type { PatchNoteSummary } from "./patch-notes-lib";
import { formatPatchDate, patchChangeAnchor } from "./patch-notes-shared";
import styles from "./patch-notes.module.css";

const PREVIEW_GROUPS = [
  { tone: "buff", label: "Усиления", symbol: "↑" },
  { tone: "nerf", label: "Ослабления", symbol: "↓" },
  { tone: "adjustment", label: "Изменения", symbol: "⚙︎" },
  { tone: "rework", label: "Переработки", symbol: "⟳" },
  { tone: "new", label: "Новое", symbol: "+" },
  { tone: "removed", label: "Удалено", symbol: "−" },
] as const;

// Official Wild Rift Nocturne splash; the patch masthead is a flat teal teaser.
// Source: https://wildrift.leagueoflegends.com/ru-ru/champions/nocturne/
const PATCH_ARTWORK: Record<string, string> = {
  "7.3b": "/patch-art/nocturne.jpg",
};
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

const PATCH_REVIEW_RUTUBE_URLS: Record<string, string> = {
  "7.3b": "https://rutube.ru/video/d1119ff5bb06302f153479916d8dcaef/",
  "7.3a": "https://rutube.ru/video/b7a748e55797dddedc90712fbafcf225/",
  "7.2e": "https://rutube.ru/video/06561ece00e79c7964074ca796028f1d/",
  "7.2d": "https://rutube.ru/video/5b32427f86198738980695cf398002f6/",
  "7.2c": "https://rutube.ru/video/1e01d6504828e90732716d1d752f0e3c/",
};
const PATCH_REVIEW_RUTUBE_THUMBNAILS: Record<string, string> = {
  "7.3b": "https://pic.rtbcdn.ru/video/2026-10-14/b3/c5/b3c5f1f565bee374ed5c03ec23ba8801.jpg",
  "7.3a": "https://pic.rtbcdn.ru/video/2026-09-29/9c/50/9c50a2cbc048f2cb65871fe94f192eed.jpg",
  "7.2e": "https://pic.rtbcdn.ru/video/2026-09-09/f3/7c/f37c59ac7514b104a9c859b3ed357009.jpg",
  "7.2d": "https://pic.rtbcdn.ru/video/2026-08-26/6a/ba/6aba3155b646045455f3c99be360f969.jpg",
  "7.2c": "https://pic.rtbcdn.ru/video/2026-08-12/7a/68/7a681f16b50e4e5db71316c95defca49.jpg",
};

export default function PatchNoteCard({ patch, patchIndex }: { patch: PatchNoteSummary; patchIndex: number }) {
  const patchHref = `/patch-notes/${encodeURIComponent(patch.version)}`;
  const videoId = PATCH_REVIEW_VIDEO_IDS[patch.version.toLowerCase()];
  const artwork = PATCH_ARTWORK[patch.version.toLowerCase()] || (patch.imageUrl
    ? `/wr-api/assets/patch-cover-${encodeURIComponent(patch.version)}?src=${encodeURIComponent(patch.imageUrl)}`
    : null);
  const groups = PREVIEW_GROUPS.map((group) => ({
    ...group,
    icons: patch.iconPreviews?.[group.tone] || [],
  })).filter((group) => group.icons.length);
  const patchVersion = patch.version.toLowerCase();
  const rutubeUrl = PATCH_REVIEW_RUTUBE_URLS[patchVersion];
  const rutubeThumbnail = PATCH_REVIEW_RUTUBE_THUMBNAILS[patchVersion];
  const hasRutubePreview = Boolean(rutubeUrl && rutubeThumbnail);
  const review = videoId || hasRutubePreview ? {
    provider: hasRutubePreview ? "Rutube" : "YouTube",
    url: hasRutubePreview ? rutubeUrl! : `https://youtu.be/${videoId}`,
    thumbnail: hasRutubePreview
      ? rutubeThumbnail!
      : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    alternateUrl: hasRutubePreview && videoId ? `https://youtu.be/${videoId}` : null,
    alternateProvider: "YouTube",
    title: `Обзор обновления ${patch.version} от INQGames`,
  } : null;
  return (
    <article className={styles.card}>
      {artwork && (
        <div className={styles.cardArtwork} aria-hidden="true">
          <Image
            src={artwork}
            alt=""
            fill
            sizes="(max-width: 760px) 100vw, 650px"
            loading={patchIndex === 0 ? "eager" : "lazy"}
            unoptimized
          />
        </div>
      )}
      <div className={styles.cardContent}>
        <header className={styles.cardHeader}>
          <div className={styles.cardHeading}>
            <div className={styles.cardKicker}>WILD RIFT <span aria-hidden="true">/</span> ОБНОВЛЕНИЕ</div>
            <div className={styles.cardMeta}>
              <Link className={styles.patchLink} href={patchHref} aria-label={`Открыть все изменения патча ${patch.version}`}>
                <h2 className={styles.version}>{patch.version}</h2>
              </Link>
              <time dateTime={patch.publishedAt || undefined}>{formatPatchDate(patch.publishedAt)}</time>
            </div>
          </div>
          {review ? (
            <div className={styles.videoPreview}>
              <a className={styles.videoThumbnail} href={review.url} target="_blank" rel="noopener noreferrer" aria-label={`${review.title} — открыть на ${review.provider}`}>
                <Image src={review.thumbnail} alt="" width={320} height={180} unoptimized />
                <span className={styles.videoPlay} aria-hidden="true">▶︎</span>
              </a>
              <span className={styles.videoCaption}>
                <span>INQGAMES</span>
                <strong>Видеообзор</strong>
                <span className={styles.videoLinks}>
                  <a href={review.url} target="_blank" rel="noopener noreferrer">Смотреть на {review.provider}</a>
                  {review.alternateUrl && <a href={review.alternateUrl} target="_blank" rel="noopener noreferrer">{review.alternateProvider}</a>}
                </span>
              </span>
            </div>
          ) : (
            <div className={`${styles.videoPreview} ${styles.videoPlaceholder}`} role="note" aria-label="Видеообзор не добавлен">
              <span className={`${styles.videoThumbnail} ${styles.emptyVideoThumbnail}`}>
              <svg
                className={styles.missingVideoIcon}
                width="34"
                height="30"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#91a4bd"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="6" width="12" height="12" rx="2" />
                <path d="m15 10 6-3v10l-6-3" />
              </svg>
              </span>
              <span className={styles.videoCaption}>
                <span>INQGAMES</span>
                <strong>Видеообзор</strong>
                <span>Тут мог бы быть ролик INQ, но кто-то не занёс за проезд</span>
              </span>
            </div>
          )}
          <Link className={styles.readPatch} href={patchHref}>Все изменения</Link>
        </header>
        {groups.length > 0 && <div className={styles.previewGroups}>
          {groups.map(({ tone, label, symbol, icons }) => {
            return (
              <section key={tone} className={`${styles.previewGroup} ${styles[tone]} ${icons.length > 16 ? styles.previewGroupWide : ""}`} aria-label={label}>
                <h3 className={styles.previewHeading}>
                  <span className={styles.previewSymbol} aria-hidden="true">{symbol}</span>
                  {label}
                </h3>
                <ul className={styles.previewEntities}>
                  {icons.map((icon) => (
                    <li
                      key={`${icon.entityKind}-${icon.entitySlug || icon.entityName}`}
                      className={styles.previewEntity}
                      title={icon.entityName}
                    >
                      <Link
                        className={styles.previewEntityLink}
                        href={`${patchHref}#${encodeURIComponent(patchChangeAnchor(icon, tone))}`}
                        aria-label={`${icon.entityName}: ${label.toLocaleLowerCase("ru-RU")} в патче ${patch.version}`}
                      >
                        <span className={styles.previewIcon}>
                          <Image src={icon.imageUrl} alt="" width={48} height={48} unoptimized />
                        </span>
                        <span className={styles.previewName}>{icon.entityName.toLocaleLowerCase("ru-RU")}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>}
      </div>
    </article>
  );
}
