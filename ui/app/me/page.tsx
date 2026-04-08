import { cookies, headers } from "next/headers";
import AuthProvidersList from "@/components/auth/AuthProvidersList";
import PrivateProfilePage from "@/components/profile/PrivateProfilePage";
import TopPillLink from "@/components/TopPillLink";
import { fetchProfileChampionOptions } from "@/lib/profile-api.js";
import { fetchSiteUserSession } from "@/lib/site-user-api.js";
import {
  getUserErrorMessage,
  getUserProviderCards,
  getUserProviders,
  getUserSessionTokenFromCookie,
  isPublicUserAuthEnabled,
} from "@/lib/site-user-auth.js";
import styles from "./profile.module.css";

type UserTelegramProvider = {
  enabled: boolean;
  botUsername?: string;
  authUrl?: string;
};

export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const sessionToken = getUserSessionTokenFromCookie(cookieStore);
  const session = await fetchSiteUserSession(sessionToken, process.env);

  const origin = `${requestHeaders.get("x-forwarded-proto") || "https"}://${requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || ""}`;
  const requestLike = { url: `${origin}/me` };
  const providerCards = getUserProviderCards(requestLike, process.env);
  const providers = getUserProviders(requestLike, process.env);
  const publicUserAuthEnabled = isPublicUserAuthEnabled(process.env);
  const telegramProvider =
    (providers as Record<string, UserTelegramProvider | undefined>).telegram || null;
  const errorValue = Array.isArray(params.error) ? params.error[0] : params.error;
  const errorText = getUserErrorMessage(errorValue);
  const updated = (Array.isArray(params.updated) ? params.updated[0] : params.updated) === "1";

  if (session) {
    const champions = await fetchProfileChampionOptions(process.env);

    return (
      <PrivateProfilePage
        profile={session}
        providerCards={providerCards}
        telegramProvider={telegramProvider}
        champions={champions}
        saveAction="/api/user/profile"
        logoutAction="/api/auth/logout"
        homeHref="/"
        title="Твой профиль"
        lead="Управляй своим профилем, игровым ником и мейн-чемпионами."
        errorText={errorText}
        updated={updated}
      />
    );
  }

  return (
    <div className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.head}>
          <div>
            <h1 className={styles.title}>Вход в профиль</h1>
            <p className={styles.lead}>Войди удобным способом или создай профиль за пару секунд.</p>
          </div>
          <TopPillLink href="/">← На главную</TopPillLink>
        </div>

        {errorText ? <div className={styles.noticeError}>{errorText}</div> : null}

        <section className={`${styles.card} ${styles.authCard}`.trim()}>
          {publicUserAuthEnabled ? (
            <AuthProvidersList
              providers={providerCards.filter((provider) => provider.id !== "telegram")}
              telegramProvider={telegramProvider}
              returnTo="/me"
              mode="login"
              layout="stack"
              compact
              iconOnly
            />
          ) : (
            <div className={styles.noticeError}>
              User auth пока не включён. Для запуска нужны `USER_AUTH_ENABLED=true` и отдельный `USER_SESSION_SECRET` в `ui` и `wr-api`.
            </div>
          )}
        </section>
      </section>
    </div>
  );
}
