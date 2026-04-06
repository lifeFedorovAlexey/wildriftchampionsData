import Link from "next/link";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import TelegramLoginButton from "@/components/admin/TelegramLoginButton";
import styles from "./admin.module.css";
import {
  getAdminProviderCards,
  getAdminProviders,
  getAdminSessionTokenFromCookie,
} from "@/lib/admin-auth.js";
import { fetchAdminSession, fetchAdminUsers } from "@/lib/admin-api.js";

const SECTION_ITEMS = [
  { id: "profile", label: "Профиль", state: "active" },
  { id: "access", label: "Доступы", state: "soon" },
  { id: "team", label: "Команда", state: "soon" },
];

function prettifyProvider(providerId: string) {
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

export default async function AdminPage() {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const sessionToken = getAdminSessionTokenFromCookie(cookieStore);
  const session = await fetchAdminSession(sessionToken, process.env);

  if (!session) {
    redirect("/admin/login");
  }

  const origin = `${requestHeaders.get("x-forwarded-proto") || "https"}://${requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || ""}`;
  const requestLike = { url: `${origin}/admin` };
  const providerCards = getAdminProviderCards(requestLike, process.env);
  const providers = getAdminProviders(requestLike, process.env);

  const users = /** @type {Array<{
    id: number;
    displayName: string;
    primaryEmail: string;
    roles: string[];
  }>} */ (await fetchAdminUsers(sessionToken, process.env));

  const linkedProviders = Array.isArray(session.identities)
    ? session.identities
    : [];

  const linkedProviderIds = new Set(
    linkedProviders.map((identity: { provider?: string }) => identity.provider).filter(Boolean),
  );

  const connectableProviders = providerCards.filter(
    (provider) => !linkedProviderIds.has(provider.id),
  );

  const telegramProvider = providers.telegram;
  const stats = [
    {
      label: "Активные роли",
      value: session.roles.length ? session.roles.join(", ") : "нет",
    },
    {
      label: "Привязанные входы",
      value: linkedProviders.length ? String(linkedProviders.length) : "1",
    },
    {
      label: "Первичный контакт",
      value: session.primaryEmail || "без email",
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.adminShell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHead}>
            <p className={styles.eyebrow}>Private Area</p>
            <h1 className={styles.sidebarTitle}>Админка</h1>
            <p className={styles.sidebarLead}>
              Нормальный рабочий кабинет без информационной простыни.
            </p>
          </div>

          <nav className={styles.sidebarNav} aria-label="Разделы админки">
            {SECTION_ITEMS.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`${styles.sidebarLink} ${item.state === "active" ? styles.sidebarLinkActive : styles.sidebarLinkMuted}`.trim()}
                aria-current={item.state === "active" ? "page" : undefined}
              >
                <span>{item.label}</span>
                <span className={styles.sidebarLinkMeta}>
                  {item.state === "active" ? "сейчас" : "скоро"}
                </span>
              </a>
            ))}
          </nav>

          <div className={styles.sidebarFooter}>
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
        </aside>

        <main className={styles.main}>
          <section id="profile" className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <p className={styles.sectionEyebrow}>Профиль</p>
                <h2 className={styles.panelTitle}>Твой админ-профиль</h2>
              </div>
              <div className={styles.profileIdentity}>
                <span className={styles.identityName}>
                  {session.displayName || session.primaryEmail || `user-${session.id}`}
                </span>
                <span className={styles.identityMeta}>
                  {session.primaryEmail || "Без публичного email"}
                </span>
              </div>
            </div>

            <div className={styles.statsRow}>
              {stats.map((stat) => (
                <article key={stat.label} className={styles.statCard}>
                  <span className={styles.statLabel}>{stat.label}</span>
                  <strong className={styles.statValue}>{stat.value}</strong>
                </article>
              ))}
            </div>

            <div className={styles.contentGrid}>
              <section className={styles.subcard}>
                <div className={styles.subcardHead}>
                  <h3 className={styles.cardTitle}>Привязанные способы входа</h3>
                  <p className={styles.cardText}>
                    Все эти входы ведут в один и тот же профиль и используют одни и те же роли.
                  </p>
                </div>

                <div className={styles.identityList}>
                  {linkedProviders.length ? (
                    linkedProviders.map(
                      (identity: {
                        provider?: string;
                        email?: string;
                        username?: string;
                        subject?: string;
                      }) => (
                        <article key={`${identity.provider}-${identity.subject}`} className={styles.identityCard}>
                          <div className={styles.identityCardHead}>
                            <span className={styles.identityProvider}>
                              {prettifyProvider(identity.provider || "linked")}
                            </span>
                            <span className={styles.badge}>Подключен</span>
                          </div>
                          <p className={styles.identityValue}>
                            {identity.email || identity.username || identity.subject || "без публичных данных"}
                          </p>
                        </article>
                      ),
                    )
                  ) : (
                    <p className={styles.emptyText}>Пока виден только текущий способ входа.</p>
                  )}
                </div>
              </section>

              <section className={styles.subcard}>
                <div className={styles.subcardHead}>
                  <h3 className={styles.cardTitle}>Подключить ещё вход</h3>
                  <p className={styles.cardText}>
                    Пока ты уже авторизован, новый провайдер привяжется к этому же профилю, а не создаст нового админа.
                  </p>
                </div>

                <div className={styles.providerStack}>
                  {connectableProviders
                    .filter((provider) => provider.id !== "telegram")
                    .map((provider) => (
                      <article key={provider.id} className={styles.providerRow}>
                        <div>
                          <h4 className={styles.providerLabel}>{provider.label}</h4>
                          <p className={styles.providerHint}>
                            {provider.enabled
                              ? "Можно подвязать прямо сейчас."
                              : "Этот провайдер пока не настроен."}
                          </p>
                        </div>
                        <Link
                          href={`${provider.startHref}?returnTo=/admin`}
                          className={`${styles.button} ${provider.enabled ? "" : styles.buttonDisabled}`.trim()}
                        >
                          Подключить
                        </Link>
                      </article>
                    ))}

                  {!linkedProviderIds.has("telegram") ? (
                    <article className={`${styles.providerRow} ${styles.providerRowStacked}`.trim()}>
                      <div>
                        <h4 className={styles.providerLabel}>Telegram</h4>
                        <p className={styles.providerHint}>
                          Для Telegram можно привязать аккаунт через официальный widget.
                        </p>
                      </div>
                      <div className={styles.telegramAction}>
                        {telegramProvider.enabled ? (
                          <TelegramLoginButton
                            botUsername={telegramProvider.botUsername}
                            authUrl={telegramProvider.authUrl}
                            size="medium"
                          />
                        ) : (
                          <span className={styles.inlineMuted}>Telegram не настроен</span>
                        )}
                      </div>
                    </article>
                  ) : null}

                  {!connectableProviders.length && linkedProviderIds.has("telegram") ? (
                    <p className={styles.emptyText}>Все доступные способы входа уже привязаны.</p>
                  ) : null}
                </div>
              </section>
            </div>
          </section>

          <section id="access" className={styles.panel}>
            <div className={styles.subcardHead}>
              <p className={styles.sectionEyebrow}>Доступы</p>
              <h2 className={styles.panelTitle}>Текущая модель прав</h2>
            </div>
            <ul className={styles.list}>
              <li className={styles.listItem}>
                Роли живут на уровне admin user, а не конкретного Google или Telegram аккаунта.
              </li>
              <li className={styles.listItem}>
                Сессия хранится в httpOnly cookie, а серверная часть может её отозвать в БД.
              </li>
              <li className={styles.listItem}>
                Следующий шаг сюда: управление ролями и приглашение новых админов.
              </li>
            </ul>
          </section>

          <section id="team" className={styles.panel}>
            <div className={styles.subcardHead}>
              <p className={styles.sectionEyebrow}>Команда</p>
              <h2 className={styles.panelTitle}>Кто уже есть в админке</h2>
            </div>
            <div className={styles.teamList}>
              {users.length ? (
                users.map((user: {
                  id: number;
                  displayName: string;
                  primaryEmail: string;
                  roles: string[];
                }) => (
                  <article key={user.id} className={styles.teamCard}>
                    <strong className={styles.teamName}>
                      {user.displayName || user.primaryEmail || `user-${user.id}`}
                    </strong>
                    <span className={styles.teamMeta}>
                      {user.primaryEmail || "Без email"}
                    </span>
                    <span className={styles.teamRoles}>
                      {user.roles.length ? user.roles.join(", ") : "без ролей"}
                    </span>
                  </article>
                ))
              ) : (
                <p className={styles.emptyText}>
                  Пока виден только текущий пользователь или роли ещё не выданы.
                </p>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
