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

type ChampionOption = {
  slug: string;
  name: string;
  iconUrl?: string;
};

function buildAvailableSections(roles: string[] | undefined) {
  const roleSet = new Set(
    Array.isArray(roles)
      ? roles.map((role) => String(role || "").trim().toLowerCase()).filter(Boolean)
      : [],
  );
  const sections = [];

  if (roleSet.has("owner") || roleSet.has("admin")) {
    sections.push({
      key: "admin",
      title: "Админка",
      description:
        "Управление админским контуром, профилем и служебными разделами. Страница уже рабочая.",
      href: "/admin",
      actionLabel: "Открыть админку",
    });
  }

  if (roleSet.has("owner")) {
    sections.push({
      key: "access",
      title: "Управление доступами",
      description:
        "Owner-only раздел со всеми зарегистрированными пользователями и назначением ролей.",
      href: "/admin/access",
      actionLabel: "Открыть доступы",
    });
  }

  if (roleSet.has("streamer")) {
    sections.push({
      key: "streamer",
      title: "Раздел стримера",
      description:
        "Отдельный кабинет для стримерских функций. Пока это аккуратная заглушка, но маршрут уже закреплён.",
      href: "/me/streamer",
      actionLabel: "Открыть раздел стримера",
    });
  }

  if (roleSet.has("patron")) {
    sections.push({
      key: "patron",
      title: "Раздел мецената",
      description:
        "Персональный раздел для меценатов. Пока это заглушка, чтобы доступы и навигация уже были на месте.",
      href: "/me/patron",
      actionLabel: "Открыть раздел мецената",
    });
  }

  sections.push({
    key: "chat",
    title: "Текстовый чат",
    description:
      "Локальный MVP чата: группы, каналы, сообщения и realtime через wr-chat. Пока это preview-контур.",
    href: "/me/chat",
    actionLabel: "Открыть чат",
  });

  return sections;
}

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
  let errorText = getUserErrorMessage(errorValue);
  const updated = (Array.isArray(params.updated) ? params.updated[0] : params.updated) === "1";

  if (session) {
    let champions: ChampionOption[] = [];
    try {
      champions = await fetchProfileChampionOptions(process.env);
    } catch {
      errorText = "Не удалось загрузить профиль. Попробуй обновить страницу или войти заново.";
    }

    const accessSections = buildAvailableSections(session.roles);

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
        accessSections={accessSections}
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
