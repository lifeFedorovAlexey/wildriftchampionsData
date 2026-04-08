import AuthProvidersList from "@/components/auth/AuthProvidersList";
import LinkedProviderIcons from "@/components/auth/LinkedProviderIcons";
import TopPillLink from "@/components/TopPillLink";
import ProfileEditorForm from "./ProfileEditorForm";
import styles from "@/app/me/profile.module.css";

type Identity = {
  provider?: string;
  avatarUrl?: string;
  name?: string;
  username?: string;
};

type ProviderCard = {
  id: string;
  label: string;
  enabled: boolean;
  startHref: string;
};

type TelegramProvider = {
  enabled: boolean;
  botUsername?: string;
  authUrl?: string;
};

type ChampionOption = {
  slug: string;
  name: string;
  iconUrl?: string;
};

type Profile = {
  id: number;
  displayName?: string;
  avatarUrl?: string;
  wildRiftHandle?: string;
  mainChampionSlugs?: string[];
  roles?: string[];
  identities?: Identity[];
};

function formatRoles(roles: string[] | undefined) {
  const normalized = Array.isArray(roles)
    ? roles.map((role) => String(role || "").trim()).filter(Boolean)
    : [];

  return normalized.length ? normalized : ["user"];
}

export default function PrivateProfilePage({
  profile,
  providerCards,
  telegramProvider,
  champions,
  saveAction,
  logoutAction,
  homeHref = "/",
  title = "Твой профиль",
  lead = "Управляй своим профилем и привязанными способами входа.",
  errorText = "",
  updated = false,
}: {
  profile: Profile;
  providerCards: ProviderCard[];
  telegramProvider: TelegramProvider | null;
  champions: ChampionOption[];
  saveAction: string;
  logoutAction: string;
  homeHref?: string;
  title?: string;
  lead?: string;
  errorText?: string;
  updated?: boolean;
}) {
  const linkedProviderIds = new Set(
    Array.isArray(profile.identities)
      ? profile.identities.map((identity) => identity.provider).filter(Boolean)
      : [],
  );

  const connectableProviders = providerCards.filter(
    (provider) => !linkedProviderIds.has(provider.id),
  );

  const roleList = formatRoles(profile.roles);

  return (
    <div className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.head}>
          <div>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.lead}>{lead}</p>
          </div>
          <TopPillLink href={homeHref}>← На главную</TopPillLink>
        </div>

        {errorText ? <div className={styles.noticeError}>{errorText}</div> : null}
        {updated ? <div className={styles.noticeOk}>Профиль обновлён.</div> : null}

        <div className={styles.grid}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Профиль</h2>
            <div className={styles.profileHeader}>
              <div className={styles.avatarWrap}>
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt=""
                    width={72}
                    height={72}
                    className={styles.avatar}
                  />
                ) : (
                  <span className={styles.avatarFallback}>
                    {(profile.displayName || "U").slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <div className={styles.profileMeta}>
                <strong className={styles.profileName}>
                  {profile.displayName || "Игрок"}
                </strong>
                <div className={styles.rolePills}>
                  {roleList.map((role) => (
                    <span key={role} className={styles.rolePill}>
                      {role}
                    </span>
                  ))}
                </div>
                {profile.wildRiftHandle ? (
                  <span className={styles.profileHandle}>{profile.wildRiftHandle}</span>
                ) : null}
              </div>
            </div>

            <ProfileEditorForm action={saveAction} profile={profile} champions={champions} />

            <form action={logoutAction} method="post">
              <button type="submit" className={`${styles.button} ${styles.buttonGhost}`.trim()}>
                Выйти
              </button>
            </form>
          </section>

          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Привязанные входы</h2>
            <LinkedProviderIcons identities={profile.identities || []} />

            {connectableProviders.filter((provider) => provider.id !== "telegram").length ||
            (!linkedProviderIds.has("telegram") && telegramProvider) ? (
              <div className={styles.connectSection}>
                <h3 className={styles.formSectionTitle}>Подключить ещё сервис</h3>
                <AuthProvidersList
                  providers={connectableProviders.filter((provider) => provider.id !== "telegram")}
                  telegramProvider={
                    linkedProviderIds.has("telegram") ? null : telegramProvider
                  }
                  returnTo={homeHref === "/admin" ? "/admin" : "/me"}
                  mode="connect"
                  layout="stack"
                  compact
                  iconOnly
                />
              </div>
            ) : null}
          </section>
        </div>
      </section>
    </div>
  );
}
