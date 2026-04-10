import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import TopPillLink from "@/components/TopPillLink";
import { fetchSiteUserSession } from "@/lib/site-user-api.js";
import { getUserSessionTokenFromCookie } from "@/lib/site-user-auth.js";
import styles from "../profile.module.css";

export default async function PatronPage() {
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

  if (!roleSet.has("patron") && !roleSet.has("owner")) {
    redirect("/me");
  }

  return (
    <div className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.head}>
          <div>
            <h1 className={styles.title}>Раздел мецената</h1>
            <p className={styles.lead}>
              Этот раздел уже закреплён за ролью `patron`. Пока здесь заглушка, но маршрут,
              защита и точка входа уже готовы.
            </p>
          </div>
          <TopPillLink href="/me">← В профиль</TopPillLink>
        </div>

        <section className={`${styles.card} ${styles.fullCard}`.trim()}>
          <h2 className={styles.cardTitle}>Будущее пространство мецената</h2>
          <p className={styles.cardCopy}>
            Сюда потом можно добавить бонусы, благодарности, приватные материалы или
            специальные настройки участия в проекте.
          </p>
        </section>
      </section>
    </div>
  );
}
