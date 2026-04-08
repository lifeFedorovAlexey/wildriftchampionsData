import Link from "next/link";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import AuthProvidersList from "@/components/auth/AuthProvidersList";
import styles from "../admin.module.css";
import {
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
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h1 className={styles.panelTitle}>Вход в админку</h1>
            <p className={styles.cardText}>
              Войди удобным способом. Если у аккаунта есть доступ, откроется админка.
            </p>
          </div>
          <Link href="/" className={styles.buttonSecondary}>
            На главную
          </Link>
        </div>
        {errorText ? <div className={styles.error}>{errorText}</div> : null}

        <AuthProvidersList
          providers={providerCards.filter((provider) => provider.id !== "telegram")}
          telegramProvider={telegramProvider}
          mode="login"
          layout="stack"
          compact
          iconOnly
        />
      </section>
    </div>
  );
}
