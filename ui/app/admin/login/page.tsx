import Link from "next/link";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import AuthProvidersList from "@/components/auth/AuthProvidersList";
import styles from "../admin.module.css";
import {
  getAdminEnvHints,
  getAdminErrorMessage,
  getAdminProviderCards,
  getAdminProviders,
  getAdminSessionTokenFromCookie,
} from "@/lib/admin-auth.js";
import { fetchAdminSession } from "@/lib/admin-api.js";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const sessionToken = getAdminSessionTokenFromCookie(cookieStore);
  const session = await fetchAdminSession(sessionToken, process.env);

  if (session) {
    redirect("/admin");
  }

  const origin = `${requestHeaders.get("x-forwarded-proto") || "https"}://${requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || ""}`;
  const requestLike = { url: `${origin}/admin/login` };
  const providerCards = getAdminProviderCards(requestLike, process.env);
  const providers = getAdminProviders(requestLike, process.env);
  const errorValue = Array.isArray(params.error) ? params.error[0] : params.error;
  const errorText = getAdminErrorMessage(errorValue);
  const telegramProvider = providers.telegram;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Admin Access</p>
        <h1 className={styles.title}>Вход в админку</h1>
        <p className={styles.lead}>
          Вход подтверждает личность через провайдера, а право доступа хранится
          в базе. Для самого первого owner можно оставить один bootstrap-аккаунт
          в env, а дальше роли уже живут в таблицах `wr-api`.
        </p>
        {errorText ? <div className={styles.error}>{errorText}</div> : null}
      </section>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Провайдеры входа</h2>
          <p className={styles.cardText}>
            Google и Yandex используют обычный OAuth login. Telegram работает
            через официальный widget. VK тоже поддержан, но включается только
            после заполнения его env-параметров.
          </p>

          <AuthProvidersList
            providers={providerCards.filter((provider) => provider.id !== "telegram")}
            telegramProvider={telegramProvider}
            mode="login"
            layout="grid"
            showStatus
          />
        </section>

        <aside className={styles.card}>
          <h2 className={styles.cardTitle}>Что надо настроить</h2>
          <p className={styles.cardText}>
            Минимум нужен общий секрет сессии и один bootstrap-owner на первое
            создание администратора. После этого список людей живёт уже в БД,
            а не в env.
          </p>
          <ul className={styles.list}>
            {getAdminEnvHints().map((hint) => (
              <li key={hint} className={styles.listItem}>
                {hint}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
