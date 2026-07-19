import TopPillLink from "@/components/TopPillLink";
import NativeImage from "@/components/ui/NativeImage";
import PageWrapper from "@/components/PageWrapper";
import PublicStreamerTierlistBoard from "../PublicStreamerTierlistBoard";
import {
  fetchPublicStreamerTierlist,
  type StreamerTierlistDetailPayload,
} from "@/lib/streamer-tierlists-api";
import { notFound } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa6";
import styles from "../streamers.module.css";

const OWNER_TELEGRAM_LINK = "https://t.me/fedorov_alexey_tg";

function formatDateLabel(value: string | null | undefined) {
  if (!value) return "Еще не опубликовано";

  try {
    return new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "medium",
      timeStyle: value.includes("T") ? "short" : undefined,
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function isEditedPublication(
  publication:
    | { publishedAt: string | null; editedAt: string | null }
    | null
    | undefined,
) {
  return Boolean(publication?.editedAt && publication.editedAt !== publication.publishedAt);
}

function getPublicationStateLabel(
  publication:
    | { publishedAt: string | null; editedAt: string | null }
    | null
    | undefined,
) {
  return isEditedPublication(publication) ? "Отредактировано" : "Опубликовано";
}

function getPublicationStateDate(
  publication:
    | { publishedAt: string | null; editedAt: string | null }
    | null
    | undefined,
) {
  return isEditedPublication(publication) ? publication?.editedAt : publication?.publishedAt;
}

export default async function StreamerTierlistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payload = (await fetchPublicStreamerTierlist(
    id,
    process.env,
  )) as StreamerTierlistDetailPayload | null;

  if (!payload?.currentPublication || !payload?.streamer) {
    notFound();
  }

  const streamer = payload.streamer;
  const publication = payload.currentPublication;

  return (
    <PageWrapper
      title={`${streamer.displayName} — текущий тирлист`}
      paragraphs={[
        "Актуальная опубликованная версия стримерского тирлиста по всем линиям.",
      ]}
      topContent={
        <TopPillLink href="/streamers">
          <FaArrowLeft aria-hidden="true" /> Все стримеры
        </TopPillLink>
      }
    >
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.streamerHead}>
            {streamer.avatarUrl ? (
              <NativeImage src={streamer.avatarUrl} alt="" className={styles.avatar} />
            ) : (
              <span className={styles.avatarFallback}>
                {(streamer.displayName || "S").slice(0, 1).toUpperCase()}
              </span>
            )}

            <div className={styles.streamerMeta}>
              <h2 className={styles.heroTitle}>{streamer.displayName}</h2>
            </div>
          </div>

          <p className={styles.heroText}>
            Это текущая публичная версия тирлиста. Если автор обновляет её в тот же день,
            запись редактируется, а не дублируется новой строкой в истории.
          </p>

          <div className={styles.metaGrid}>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>{getPublicationStateLabel(publication)}</span>
              <span className={styles.metaValue}>
                {formatDateLabel(getPublicationStateDate(publication))}
              </span>
            </div>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>Срез базы</span>
              <span className={styles.metaValue}>{publication.sourceStatsDate || "не указан"}</span>
            </div>
            <div className={styles.metaCard}>
              <span className={styles.metaLabel}>Сотрудничество</span>
              <a
                href={OWNER_TELEGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.metaLink}
              >
                Хочу свой тирлист
              </a>
            </div>
          </div>
        </section>

        <PublicStreamerTierlistBoard payload={publication.payload} />

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>История публикаций</h2>
          <div className={styles.historyList}>
            {payload.history.map((entry) => (
              <div key={entry.id} className={styles.historyRow}>
                <div>
                  <div className={styles.streamerName}>
                    {isEditedPublication(entry)
                      ? `Публикация #${entry.id} · Отредактировано`
                      : `Публикация #${entry.id}`}
                  </div>
                  <div className={styles.metaText}>
                    {getPublicationStateLabel(entry)}: {formatDateLabel(getPublicationStateDate(entry))}
                  </div>
                </div>
                <div className={styles.metaText}>
                  Срез базы: {entry.sourceStatsDate || "не указан"}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}
