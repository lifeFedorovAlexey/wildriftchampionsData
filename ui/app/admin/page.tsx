import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import PrivateProfilePage from "@/components/profile/PrivateProfilePage";
import { fetchAdminProfile, fetchAdminSession } from "@/lib/admin-api.js";
import {
  getAdminErrorMessage,
  getAdminProviderCards,
  getAdminProviders,
  getAdminSessionTokenFromCookie,
} from "@/lib/admin-auth.js";
import { fetchProfileChampionOptions } from "@/lib/profile-api.js";
import styles from "./admin.module.css";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const sessionToken = getAdminSessionTokenFromCookie(cookieStore);
  const session = await fetchAdminSession(sessionToken, process.env);

  if (!session) {
    redirect("/admin/login");
  }

  const profile = await fetchAdminProfile(sessionToken, process.env);
  if (!profile) {
    redirect("/admin/login?error=profile_update_failed");
  }

  const origin = `${requestHeaders.get("x-forwarded-proto") || "https"}://${requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || ""}`;
  const requestLike = { url: `${origin}/admin` };
  const providerCards = getAdminProviderCards(requestLike, process.env);
  const providers = getAdminProviders(requestLike, process.env);
  const errorValue = Array.isArray(params.error) ? params.error[0] : params.error;
  const errorText = getAdminErrorMessage(errorValue);
  const updated = (Array.isArray(params.updated) ? params.updated[0] : params.updated) === "1";
  const champions = await fetchProfileChampionOptions(process.env);

  return (
    <div className={styles.page}>
      <div className={styles.adminShell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHead}>
            <div className={styles.eyebrow}>Private Area</div>
            <h1 className={styles.sidebarTitle}>Админка</h1>
            <p className={styles.sidebarLead}>
              Общий профильный шаблон остался, но админская зона снова живёт в своей shell-обвязке.
            </p>
          </div>

          <nav className={styles.sidebarNav} aria-label="Навигация админки">
            <div className={`${styles.sidebarLink} ${styles.sidebarLinkActive}`}>
              <span>Профиль</span>
              <span className={styles.sidebarLinkMeta}>Сейчас</span>
            </div>
            <div className={`${styles.sidebarLink} ${styles.sidebarLinkMuted}`}>
              <span>Доступы</span>
              <span className={styles.sidebarLinkMeta}>Скоро</span>
            </div>
            <div className={`${styles.sidebarLink} ${styles.sidebarLinkMuted}`}>
              <span>Команда</span>
              <span className={styles.sidebarLinkMeta}>Скоро</span>
            </div>
          </nav>

          <div className={styles.sidebarFooter}>
            <Link href="/guides" className={styles.button}>Открыть гайды</Link>
            <form action="/api/admin/auth/logout" method="post">
              <button type="submit" className={`${styles.button} ${styles.buttonSecondary}`}>
                Выйти
              </button>
            </form>
          </div>
        </aside>

        <div className={styles.main}>
          <PrivateProfilePage
            profile={profile}
            providerCards={providerCards}
            telegramProvider={providers.telegram || null}
            champions={champions}
            saveAction="/api/admin/profile"
            logoutAction="/api/admin/auth/logout"
            homeHref="/"
            title="Твой профиль"
            lead="Один и тот же профиль доступен и в user, и в admin-зоне."
            errorText={errorText}
            updated={updated}
            embedded
            showHomeLink={false}
            showLogoutButton={false}
          />
        </div>
      </div>
    </div>
  );
}
