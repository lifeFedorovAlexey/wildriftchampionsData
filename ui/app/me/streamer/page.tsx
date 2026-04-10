import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import TopPillLink from "@/components/TopPillLink";
import { fetchSiteUserSession } from "@/lib/site-user-api.js";
import { getUserSessionTokenFromCookie } from "@/lib/site-user-auth.js";
import styles from "../profile.module.css";

export default async function StreamerPage() {
  const cookieStore = await cookies();
  const sessionToken = getUserSessionTokenFromCookie(cookieStore);
  const session = await fetchSiteUserSession(sessionToken, process.env);

  if (!session) {
    redirect("/me");
  }

  const roleSet = new Set(
    Array.isArray(session.roles)
      ? session.roles
          .map((role: string) => String(role || "").trim().toLowerCase())
          .filter(Boolean)
      : [],
  );

  if (!roleSet.has("streamer") && !roleSet.has("owner")) {
    redirect("/me");
  }

  return (
    <div className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.head}>
          <div>
            <h1 className={styles.title}>Раздел стримера</h1>
            <p className={styles.lead}>
              Доступ уже открыт. Здесь позже появятся стримерские инструменты, а пока это
              чистая заглушка с готовым маршрутом и проверкой роли.
            </p>
          </div>
          <TopPillLink href="/me">← В профиль</TopPillLink>
        </div>

        <section className={`${styles.card} ${styles.fullCard}`.trim()}>
          <h2 className={styles.cardTitle}>Скоро здесь будет больше</h2>
          <p className={styles.cardCopy}>
            Можно спокойно навешивать будущие функции на этот маршрут: блок промо, ссылки,
            кастомные виджеты, стримерские заявки или настройки профиля.
          </p>
        </section>
      </section>
    </div>
  );
}
