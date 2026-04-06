import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import styles from "./admin.module.css";
import { getAdminSessionTokenFromCookie } from "@/lib/admin-auth.js";
import { fetchAdminSession, fetchAdminUsers } from "@/lib/admin-api.js";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const sessionToken = getAdminSessionTokenFromCookie(cookieStore);
  const session = await fetchAdminSession(sessionToken, process.env);

  if (!session) {
    redirect("/admin/login");
  }

  const users = /** @type {Array<{
    id: number;
    displayName: string;
    primaryEmail: string;
    roles: string[];
  }>} */ (await fetchAdminUsers(sessionToken, process.env));

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Private Area</p>
        <h1 className={styles.title}>Панель администратора</h1>
        <p className={styles.lead}>
          Базовый вход уже поднят. Дальше сюда можно безопасно подвязать импорт
          гайдов, ручной перезапуск синков, модерацию новостей и любые другие
          закрытые действия.
        </p>

        <div className={styles.profileRow}>
          <span className={styles.pill}>
            Identity: {session.identities?.[0]?.provider || "linked"}
          </span>
          <span className={styles.pill}>
            Пользователь: {session.displayName || session.primaryEmail || session.id}
          </span>
          {session.primaryEmail ? <span className={styles.pill}>{session.primaryEmail}</span> : null}
          <span className={styles.pill}>Роли: {session.roles.join(", ")}</span>
        </div>

        <div className={styles.actions}>
          <Link href="/guides" className={styles.button}>
            Открыть гайды
          </Link>
          <form action="/api/admin/auth/logout" method="post" className={styles.logoutForm}>
            <button
              type="submit"
              className={`${styles.button} ${styles.buttonSecondary} ${styles.logoutButton}`.trim()}
            >
              Выйти
            </button>
          </form>
        </div>
      </section>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Что уже готово</h2>
          <ul className={styles.list}>
            <li className={styles.listItem}>
              Opaque session token хранится только в httpOnly cookie, а сама
              сессия живёт в БД и может быть отозвана.
            </li>
            <li className={styles.listItem}>
              Роли и права живут в БД через `admin_users`, `admin_identities`,
              `admin_roles`, `admin_user_roles` и `admin_sessions`.
            </li>
            <li className={styles.listItem}>
              Первый owner может создаться через bootstrap env, а дальше доступ
              решается уже не через env, а через таблицы.
            </li>
          </ul>
        </section>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Текущие админы</h2>
          <ul className={styles.list}>
            {users.length ? (
              users.map((user: {
                id: number;
                displayName: string;
                primaryEmail: string;
                roles: string[];
              }) => (
                <li key={user.id} className={styles.listItem}>
                  {user.displayName || user.primaryEmail || `user-${user.id}`} |{" "}
                  {user.roles.join(", ")} | {user.primaryEmail || "no-email"}
                </li>
              ))
            ) : (
              <li className={styles.listItem}>
                Пока виден только текущий пользователь или роли ещё не выданы.
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
