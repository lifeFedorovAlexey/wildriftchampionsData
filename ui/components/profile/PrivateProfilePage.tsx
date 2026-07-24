import Image from "next/image";
import {
  FaArrowLeft,
  FaComments,
  FaHeart,
  FaKey,
  FaLink,
  FaRightFromBracket,
  FaShieldHalved,
  FaSliders,
  FaUserPen,
  FaVideo,
} from "react-icons/fa6";
import AuthProvidersList from "@/components/auth/AuthProvidersList";
import LinkedProviderIcons from "@/components/auth/LinkedProviderIcons";
import TopPillLink from "@/components/TopPillLink";
import NativeImage from "@/components/ui/NativeImage";
import { buildPeakRankIconUrl, getPeakRankLabel } from "@/lib/profile-ranks.js";
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

type AccessSection = {
  key: string;
  title: string;
  description: string;
  href: string;
};

type Profile = {
  id: number;
  displayName?: string;
  avatarUrl?: string;
  wildRiftHandle?: string;
  peakRank?: string;
  mainChampionSlugs?: string[];
  roles?: string[];
  identities?: Identity[];
};

function getAccessIcon(key: string) {
  switch (key) {
    case "admin":
      return <FaShieldHalved aria-hidden="true" />;
    case "access":
      return <FaKey aria-hidden="true" />;
    case "streamer":
      return <FaVideo aria-hidden="true" />;
    case "patron":
      return <FaHeart aria-hidden="true" />;
    case "chat":
      return <FaComments aria-hidden="true" />;
    default:
      return <FaSliders aria-hidden="true" />;
  }
}

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
  embedded = false,
  showHomeLink = true,
  showLogoutButton = true,
  accessSections = [],
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
  embedded?: boolean;
  showHomeLink?: boolean;
  showLogoutButton?: boolean;
  accessSections?: AccessSection[];
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
  const peakRankLabel = getPeakRankLabel(profile.peakRank);
  const peakRankIconUrl = buildPeakRankIconUrl(profile.peakRank);

  return (
    <div className={embedded ? styles.pageEmbedded : styles.page}>
      <section className={embedded ? styles.shellEmbedded : styles.shell}>
        <div className={embedded ? styles.headEmbedded : styles.head}>
          <div>
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.lead}>{lead}</p>
          </div>
          {showHomeLink ? (
            <TopPillLink href={homeHref}>
              <FaArrowLeft aria-hidden="true" /> На главную
            </TopPillLink>
          ) : null}
        </div>

        {errorText ? <div className={styles.noticeError}>{errorText}</div> : null}
        {updated ? <div className={styles.noticeOk}>Профиль обновлён.</div> : null}

        <div className={styles.grid}>
          <section className={`${styles.card} ${styles.profileSummary}`.trim()}>
            <div className={styles.profileHeader}>
              <div className={styles.avatarWrap}>
                {profile.avatarUrl ? (
                  <NativeImage
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
                {peakRankLabel ? (
                  <span className={styles.profileRank}>
                    {peakRankIconUrl ? (
                      <Image
                        src={peakRankIconUrl}
                        alt=""
                        width={26}
                        height={26}
                        sizes="26px"
                        className={styles.profileRankIcon}
                      />
                    ) : null}
                    <span>Максимальный ранг: {peakRankLabel}</span>
                  </span>
                ) : null}
              </div>
            </div>

            <div className={styles.providerPanel}>
              <div className={styles.compactHeading}>
                <span className={styles.headingIcon}>
                  <FaLink aria-hidden="true" />
                </span>
                <span>
                  <strong>Способы входа</strong>
                  <small>Подключённые аккаунты и новые сервисы</small>
                </span>
              </div>
              <div className={styles.providerGroups}>
                <div className={styles.providerGroup}>
                  <span className={styles.microLabel}>Подключены</span>
                  <LinkedProviderIcons identities={profile.identities || []} />
                </div>

                {connectableProviders.filter((provider) => provider.id !== "telegram").length ||
                (!linkedProviderIds.has("telegram") && telegramProvider) ? (
                  <div className={styles.providerGroup}>
                    <span className={styles.microLabel}>Добавить</span>
                    <AuthProvidersList
                      providers={connectableProviders.filter(
                        (provider) => provider.id !== "telegram",
                      )}
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
              </div>
            </div>
          </section>

          <section className={`${styles.card} ${styles.editorCard}`.trim()}>
            <div className={styles.sectionHeading}>
              <span className={styles.headingIcon}>
                <FaUserPen aria-hidden="true" />
              </span>
              <div>
                <h2 className={styles.cardTitle}>Настройки игрока</h2>
                <p>Ник, Riot ID, ранг, аватар и любимые чемпионы.</p>
              </div>
            </div>

            <ProfileEditorForm action={saveAction} profile={profile} champions={champions} />

            {showLogoutButton ? (
              <form action={logoutAction} method="post" className={styles.logoutForm}>
                <button type="submit" className={`${styles.button} ${styles.buttonGhost}`.trim()}>
                  <FaRightFromBracket aria-hidden="true" /> Выйти из профиля
                </button>
              </form>
            ) : null}
          </section>

          {accessSections.length ? (
            <section className={`${styles.card} ${styles.fullCard}`.trim()}>
              <div className={styles.sectionHeading}>
                <span className={styles.headingIcon}>
                  <FaSliders aria-hidden="true" />
                </span>
                <div>
                  <h2 className={styles.cardTitle}>Твои возможности</h2>
                  <p>Разделы, доступные для текущих ролей аккаунта.</p>
                </div>
              </div>
              <div className={styles.accessList}>
                {accessSections.map((section) => (
                  <a key={section.key} href={section.href} className={styles.accessCard}>
                    <span className={styles.accessIcon}>{getAccessIcon(section.key)}</span>
                    <div className={styles.accessContent}>
                      <div className={styles.accessCardHead}>
                        <h3 className={styles.accessTitle}>{section.title}</h3>
                        <span className={styles.accessBadge}>Доступно</span>
                      </div>
                      <p className={styles.accessDescription}>{section.description}</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  );
}
