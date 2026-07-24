import { notFound } from "next/navigation";
import PageWrapper from "@/components/PageWrapper";
import TopPillLink from "@/components/TopPillLink";
import PublicStreamerTierlistBoard from "@/app/streamers/PublicStreamerTierlistBoard";
import { fetchPublicTierlist } from "@/lib/streamer-tierlists-api";
import styles from "@/app/streamers/streamers.module.css";

function formatDateLabel(value: string | null | undefined) {
  if (!value) return "Дата не указана";
  try {
    return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(value),
    );
  } catch {
    return value;
  }
}

export default async function PublicTierlistPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const payload = await fetchPublicTierlist(publicId, process.env);
  if (!payload?.currentPublication) notFound();

  const publication = payload.currentPublication;
  const authorName = publication.authorName || payload.streamer.displayName || "Автор тирлиста";

  return (
    <PageWrapper
      title={`${authorName} — тирлист`}
      paragraphs={["Публичная версия доступна по прямой ссылке без регистрации."]}
      topContent={<TopPillLink href="/tierlists/create">Создать свой тирлист</TopPillLink>}
    >
      <div className={styles.page}>
        <section className={styles.hero}>
          <h2 className={styles.heroTitle}>{authorName}</h2>
          <p className={styles.heroText}>
            {publication.payload.mode === "overall"
              ? "Общая оценка чемпионов без разделения по линиям."
              : "Оценка чемпионов отдельно для каждой линии."}
          </p>
          <div className={styles.metaGrid}>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>Опубликовано</span>
              <span className={styles.metaValue}>
                {formatDateLabel(publication.editedAt || publication.publishedAt)}
              </span>
            </div>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>Срез базы</span>
              <span className={styles.metaValue}>{publication.sourceStatsDate || "не указан"}</span>
            </div>
          </div>
        </section>

        <PublicStreamerTierlistBoard payload={publication.payload} />
      </div>
    </PageWrapper>
  );
}
