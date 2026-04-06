import Link from "next/link";
import { cookies, headers } from "next/headers";
import TelegramLoginButton from "@/components/admin/TelegramLoginButton";
import AuthProviderIcon from "@/components/icons/AuthProviderIcon";
import { fetchSiteUserSession } from "@/lib/site-user-api.js";
import {
  getUserErrorMessage,
  getUserProvider,
  getUserProviderCards,
  getUserSessionTokenFromCookie,
} from "@/lib/site-user-auth.js";
import styles from "./profile.module.css";

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
  const telegramProvider = getUserProvider(requestLike, "telegram", process.env);
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
              {session ? "Твой профиль" : "Вход для обычного пользователя"}
            </h1>
            <p className={styles.lead}>
              Вход через те же сервисы, но без админских прав и без email-логики. Просто обычный user-профиль.
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
                    <div key={identity.id} className={styles.identityRow}>
                      <div className={styles.identityMain}>
                        <span className={styles.providerIcon}>
                          <AuthProviderIcon
                            providerId={identity.provider || "user"}
                            className={styles.providerIconGraphic}
                          />
                        </span>
                        <div className={styles.identityCopy}>
                          <strong className={styles.identityTitle}>
                            {getProviderLabel(identity.provider || "user")}
                          </strong>
                          <span className={styles.identitySubtitle}>
                            {identity.name || identity.username || identity.subject || "подключен"}
                          </span>
                        </div>
                      </div>
                      <span className={styles.badge}>Есть</span>
                    </div>
                  ))
                ) : null}
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Подключить ещё сервис</h2>
              <div className={styles.providerList}>
                {connectableProviders
                  .filter((provider) => provider.id !== "telegram")
                  .map((provider) => (
                    <Link
                      key={provider.id}
                      href={`${provider.startHref}?returnTo=/me`}
                      className={`${styles.providerLink} ${provider.enabled ? "" : styles.providerLinkDisabled}`.trim()}
                    >
                      <span className={styles.providerIcon}>
                        <AuthProviderIcon
                          providerId={provider.id}
                          className={styles.providerIconGraphic}
                        />
                      </span>
                      <span>{provider.label}</span>
                    </Link>
                  ))}

                {!linkedProviderIds.has("telegram") ? (
                  telegramProvider?.enabled ? (
                    <div className={styles.telegramInline}>
                      <TelegramLoginButton
                        botUsername={telegramProvider.botUsername}
                        authUrl={telegramProvider.authUrl}
                        size="medium"
                      />
                    </div>
                  ) : null
                ) : null}
              </div>
            </section>
          </div>
        ) : (
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Зайти или зарегистрироваться</h2>
            <div className={styles.providerList}>
              {providerCards
                .filter((provider) => provider.id !== "telegram")
                .map((provider) => (
                  <Link
                    key={provider.id}
                    href={`${provider.startHref}?returnTo=/me`}
                    className={`${styles.providerLink} ${provider.enabled ? "" : styles.providerLinkDisabled}`.trim()}
                  >
                    <span className={styles.providerIcon}>
                      <AuthProviderIcon
                        providerId={provider.id}
                        className={styles.providerIconGraphic}
                      />
                    </span>
                    <span>{provider.label}</span>
                  </Link>
                ))}

              {telegramProvider?.enabled ? (
                <div className={styles.telegramInline}>
                  <TelegramLoginButton
                    botUsername={telegramProvider.botUsername}
                    authUrl={telegramProvider.authUrl}
                    size="medium"
                  />
                </div>
              ) : null}
            </div>
          </section>
        )}
      </section>
    </div>
  );
}
