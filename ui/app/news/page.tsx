import Link from "next/link";

import PageWrapper from "@/components/PageWrapper";

import { fetchNewsListFromApi } from "./news-lib";
import styles from "./page.module.css";

export const revalidate = 300;

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export default async function NewsPage() {
  const items = await fetchNewsListFromApi(30);

  return (
    <PageWrapper
      title="Новости и патчноуты"
      paragraphs={[
        "Лента обновлений Wild Rift: патчи, релизы чемпионов, скины и важные изменения, которые уже прошли через наш news flow.",
      ]}
    >
      <div className={styles.page}>
        {!items.length ? (
          <div className={styles.empty}>Пока нет данных новостей. Проверь импорт и API.</div>
        ) : (
          <div className={styles.grid}>
            {items.map((item) => (
              <Link key={item.id} href={`/news/${item.id}`} className={styles.card}>
                <div className={styles.top}>
                  <div className={styles.metaRow}>
                    {item.patchVersion ? (
                      <span className={styles.chip}>Патч {item.patchVersion}</span>
                    ) : null}
                    {item.pageType ? <span className={styles.chip}>{item.pageType}</span> : null}
                    {item.publishedAt ? (
                      <span className={styles.chip}>{formatDate(item.publishedAt)}</span>
                    ) : null}
                  </div>

                  <h2 className={styles.title}>{item.title || "Без названия"}</h2>

                  {item.description ? (
                    <p className={styles.description}>{item.description}</p>
                  ) : null}
                </div>

                <div className={styles.stats}>
                  <span className={styles.stat}>
                    События <strong>{item.counts.events}</strong>
                  </span>
                  <span className={styles.stat}>
                    Предметы <strong>{item.counts.itemChanges}</strong>
                  </span>
                  <span className={styles.stat}>
                    Скины <strong>{item.counts.skins}</strong>
                  </span>
                  <span className={styles.stat}>
                    Чемпионы <strong>{item.counts.newChampions}</strong>
                  </span>
                </div>

                {item.eventsPreview.length ? (
                  <div className={styles.preview}>
                    <p className={styles.previewTitle}>Ключевые события</p>
                    <ul className={styles.previewList}>
                      {item.eventsPreview.map((event) => (
                        <li key={event.id} className={styles.previewItem}>
                          <strong>{event.title || "Событие"}</strong>
                          {event.summary ? <span>{event.summary}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
