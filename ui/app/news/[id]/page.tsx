import { notFound } from "next/navigation";

import PageWrapper from "@/components/PageWrapper";

import { fetchNewsDetailFromApi } from "../news-lib";
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

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const payload = await fetchNewsDetailFromApi(id);

  if (!payload?.article) {
    notFound();
  }

  const article = payload.article;
  const raw = article.rawPayload || {};
  const itemChanges = Array.isArray(raw.itemChanges) ? raw.itemChanges : [];
  const skins = Array.isArray(raw.skins) ? raw.skins : [];
  const newChampions = Array.isArray(raw.newChampions) ? raw.newChampions : [];

  return (
    <PageWrapper
      title={article.title || "Новость"}
      paragraphs={[article.description || "Подробная раскладка новости из pipeline."]}
    >
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.metaRow}>
            {article.patchVersion ? (
              <span className={styles.chip}>Патч {article.patchVersion}</span>
            ) : null}
            {raw.pageType ? <span className={styles.chip}>{raw.pageType}</span> : null}
            {article.publishedAt ? (
              <span className={styles.chip}>{formatDate(article.publishedAt)}</span>
            ) : null}
          </div>

          <h1 className={styles.title}>{article.title || "Без названия"}</h1>

          {article.description ? (
            <p className={styles.description}>{article.description}</p>
          ) : null}

          <div className={styles.actions}>
            <a
              href={article.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.linkButton}
            >
              Открыть оригинал
            </a>
          </div>
        </section>

        <section className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>События</span>
            <span className={styles.statValue}>{article.counts.events}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Предметы</span>
            <span className={styles.statValue}>{article.counts.itemChanges}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Скины</span>
            <span className={styles.statValue}>{article.counts.skins}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Новые чемпионы</span>
            <span className={styles.statValue}>{article.counts.newChampions}</span>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Champion Events</h2>
          {payload.events.length ? (
            <div className={styles.list}>
              {payload.events.map((event) => (
                <article key={event.id} className={styles.card}>
                  <h3 className={styles.cardTitle}>{event.title || "Событие"}</h3>
                  <p className={styles.cardText}>
                    {event.summary || "Без краткого описания"}
                  </p>
                  <div className={styles.metaRow}>
                    {event.date ? <span className={styles.chip}>{event.date}</span> : null}
                    {event.championSlug ? (
                      <span className={styles.chip}>{event.championSlug}</span>
                    ) : null}
                    {event.type ? <span className={styles.chip}>{event.type}</span> : null}
                    {event.scope ? <span className={styles.chip}>{event.scope}</span> : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>Для этой статьи champion events пока не сформированы.</p>
          )}
        </section>

        {newChampions.length ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Новые чемпионы</h2>
            <div className={styles.list}>
              {newChampions.map((entry, index) => (
                <article key={`${entry.name || "champ"}-${index}`} className={styles.card}>
                  <h3 className={styles.cardTitle}>{entry.name || "Новый чемпион"}</h3>
                  {entry.summary ? <p className={styles.cardText}>{entry.summary}</p> : null}
                  {entry.availabilityText ? (
                    <p className={styles.cardText}>{entry.availabilityText}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {itemChanges.length ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Изменения предметов</h2>
            <div className={styles.list}>
              {itemChanges.map((entry, index) => (
                <article key={`${entry.name || "item"}-${index}`} className={styles.card}>
                  <h3 className={styles.cardTitle}>{entry.name || "Предмет"}</h3>
                  {entry.summary ? <p className={styles.cardText}>{entry.summary}</p> : null}
                  {Array.isArray(entry.changes) && entry.changes.length ? (
                    <ul className={styles.subList}>
                      {entry.changes.map((change, changeIndex) => (
                        <li key={`${index}-${changeIndex}`}>{change}</li>
                      ))}
                    </ul>
                  ) : entry.bodyText ? (
                    <p className={styles.cardText}>{entry.bodyText}</p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {skins.length ? (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Скины</h2>
            <div className={styles.list}>
              {skins.map((entry, index) => (
                <article key={`${entry.name || "skin"}-${index}`} className={styles.card}>
                  <h3 className={styles.cardTitle}>{entry.name || "Скин"}</h3>
                  {entry.availabilityText ? (
                    <p className={styles.cardText}>{entry.availabilityText}</p>
                  ) : null}
                  {entry.availableAt ? (
                    <div className={styles.metaRow}>
                      <span className={styles.chip}>{formatDate(entry.availableAt)}</span>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PageWrapper>
  );
}
