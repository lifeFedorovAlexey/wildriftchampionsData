import Link from "next/link";
import NativeImage from "@/components/ui/NativeImage";
import PageWrapper from "@/components/PageWrapper";
import {
  fetchPublicStreamerTierlists,
  type StreamerTierlistIndexPayload,
} from "@/lib/streamer-tierlists-api";
import styles from "./streamers.module.css";

const OWNER_TELEGRAM_LINK = "https://t.me/fedorov_alexey_tg";

function formatDateLabel(value: string | null | undefined) {
  if (!value) return "Еще не публиковал";

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

export default async function StreamersPage() {
  const payload = (await fetchPublicStreamerTierlists(process.env)) as StreamerTierlistIndexPayload;
  const streamers = Array.isArray(payload?.streamers) ? payload.streamers : [];

  return (
    <PageWrapper
      title="Личные Тирлисты Стримеров"
      paragraphs={[
        "Здесь собраны актуальные публичные тирлисты стримеров, опубликованные прямо через их личный кабинет.",
      ]}
    >
      <div className={styles.page}>
        <section className={styles.hero}>
          <h2 className={styles.heroTitle}>Живая мета глазами стримеров</h2>
          <p className={styles.heroLead}>
            Не один усредненный список, а отдельные авторские взгляды на каждую линию.
          </p>
          <p className={styles.heroText}>
            Выбирай стримера, открывай его текущий тирлист и смотри, как меняется личное
            видение меты по мере новых публикаций.
          </p>
        </section>

        <section className={styles.ctaCard}>
          <h3 className={styles.cardTitle}>Хочешь добавить свой тирлист на сайт?</h3>
          <p className={styles.ctaText}>
            Если ты стример и хочешь получить свой кабинет с публикацией тирлистов на
            сайте, напиши мне в Telegram. Подключим твою страницу и историю публикаций.
          </p>
          <a
            href={OWNER_TELEGRAM_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaLink}
          >
            Написать в Telegram
          </a>
        </section>

        {streamers.length ? (
          <div className={styles.streamerList}>
            {streamers.map((entry) => {
              const streamer = entry.streamer;
              const publication = entry.currentPublication;

              return (
                <Link
                  key={streamer.id}
                  href={`/streamers/${streamer.id}`}
                  className={`${styles.card} ${styles.streamerListItem}`.trim()}
                >
                  <div className={styles.streamerHead}>
                    {streamer.avatarUrl ? (
                      <NativeImage src={streamer.avatarUrl} alt="" className={styles.avatar} />
                    ) : (
                      <span className={styles.avatarFallback}>
                        {(streamer.displayName || "S").slice(0, 1).toUpperCase()}
                      </span>
                    )}

                    <div className={styles.streamerMeta}>
                      <h3 className={styles.streamerName}>{streamer.displayName}</h3>
                    </div>
                  </div>

                  <div className={styles.streamerDates}>
                    <p className={styles.metaText}>
                      {isEditedPublication(publication)
                        ? `Последнее изменение: ${formatDateLabel(publication?.editedAt)}`
                        : `Последняя публикация: ${formatDateLabel(publication?.publishedAt)}`}
                    </p>
                    <p className={styles.metaText}>
                      Срез базы: {publication?.sourceStatsDate || "не указан"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <section className={styles.card}>
            <h3 className={styles.cardTitle}>Пока без публикаций</h3>
            <p className={styles.emptyState}>
              Как только стримеры начнут публиковать свои тирлисты, они появятся здесь
              в виде отдельного списка.
            </p>
          </section>
        )}
      </div>
    </PageWrapper>
  );
}
