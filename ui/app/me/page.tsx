import Link from "next/link";
import { cookies, headers } from "next/headers";
import AuthProvidersList from "@/components/auth/AuthProvidersList";
import AuthProviderIcon from "@/components/icons/AuthProviderIcon";
import { fetchSiteUserSession } from "@/lib/site-user-api.js";
import {
  getUserErrorMessage,
  getUserProviderCards,
  getUserProviders,
  isPublicUserAuthEnabled,
  getUserSessionTokenFromCookie,
} from "@/lib/site-user-auth.js";
import styles from "./profile.module.css";

type UserTelegramProvider = {
  enabled: boolean;
  botUsername?: string;
  authUrl?: string;
};

function getProviderLabel(providerId: string) {
  switch (providerId) {
    case "google":
      return "Google";
    case "yandex":
      return "Yandex";
    case "vk":
      return "VK";
    case "telegram":
      return "Telegram";
    default:
      return providerId;
  }
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
  const errorText = getUserErrorMessage(errorValue);
  const updated = (Array.isArray(params.updated) ? params.updated[0] : params.updated) === "1";

  const linkedProviderIds = new Set(
    Array.isArray(session?.identities)
      ? session.identities.map((identity: { provider?: string }) => identity.provider).filter(Boolean)
      : [],
  );

  const connectableProviders = providerCards.filter(
    (provider) => !linkedProviderIds.has(provider.id),
  );

  return (
    <div className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.head}>
          <div>
            <h1 className={styles.title}>
              {session ? "Твой профиль" : "Вход в профиль"}
            </h1>
            <p className={styles.lead}>
              {session
                ? "Управляй своим профилем и привязанными способами входа."
                : "Войди удобным способом или создай профиль за пару секунд."}
            </p>
          </div>
          <Link href="/" className={styles.backLink}>
            На главную
          </Link>
        </div>

        {errorText ? <div className={styles.noticeError}>{errorText}</div> : null}
        {updated ? <div className={styles.noticeOk}>Профиль обновлён.</div> : null}

        {session ? (
          <div className={styles.grid}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Профиль</h2>
              <div className={styles.profileHeader}>
                <div className={styles.avatarWrap}>
                  {session.avatarUrl ? (
                    <img
                      src={session.avatarUrl}
                      alt=""
                      width={72}
                      height={72}
                      className={styles.avatar}
                    />
                  ) : (
                    <span className={styles.avatarFallback}>
                      {(session.displayName || "U").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className={styles.profileMeta}>
                  <strong className={styles.profileName}>
                    {session.displayName || "User"}
                  </strong>
                  <span className={styles.profileRole}>Роль: user</span>
                </div>
              </div>

              <form action="/api/user/profile" method="post" className={styles.form}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Имя</span>
                  <input
                    name="displayName"
                    defaultValue={session.displayName || ""}
                    placeholder="Как тебя показывать на сайте"
                    className={styles.input}
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Иконка</span>
                  <input
                    name="avatarUrl"
                    defaultValue={session.avatarUrl || ""}
                    placeholder="https://..."
                    className={styles.input}
                  />
                </label>
                <button type="submit" className={styles.button}>
                  Сохранить
                </button>
              </form>

              <form action="/api/auth/logout" method="post">
                <button type="submit" className={`${styles.button} ${styles.buttonGhost}`.trim()}>
                  Выйти
                </button>
              </form>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Привязанные входы</h2>
              <div className={styles.identityList}>
                {Array.isArray(session.identities) && session.identities.length ? (
                  session.identities.map((identity: {
                    id: number;
                    provider?: string;
                    username?: string;
                    name?: string;
                    subject?: string;
                    avatarUrl?: string;
                  }) => (
                    <span
                      key={identity.id}
                      className={styles.identityRow}
                      title={`${getProviderLabel(identity.provider || "user")}${identity.name || identity.username || identity.subject ? `: ${identity.name || identity.username || identity.subject}` : ""}`}
                      aria-label={`${getProviderLabel(identity.provider || "user")} подключен`}
                    >
                      <span className={styles.providerIcon}>
                        <AuthProviderIcon
                          providerId={identity.provider || "user"}
                          className={styles.providerIconGraphic}
                        />
                      </span>
                    </span>
                  ))
                ) : null}
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Подключить ещё сервис</h2>
              <AuthProvidersList
                providers={connectableProviders.filter((provider) => provider.id !== "telegram")}
                telegramProvider={
                  linkedProviderIds.has("telegram") ? null : telegramProvider
                }
                returnTo="/me"
                mode="connect"
                layout="stack"
                compact
                iconOnly
                emptyText="Все доступные способы входа уже привязаны."
              />
            </section>
          </div>
        ) : (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Войти или зарегистрироваться</h2>
            <p className={styles.cardCopy}>
              Выбери удобный сервис для входа. Если профиля ещё нет, он создастся автоматически.
            </p>
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
                User auth пока не включён. Для запуска нужны `USER_AUTH_ENABLED=true` и
                отдельный `USER_SESSION_SECRET` в `ui` и `wr-api`.
              </div>
            )}
          </section>
        )}
      </section>
    </div>
  );
}
