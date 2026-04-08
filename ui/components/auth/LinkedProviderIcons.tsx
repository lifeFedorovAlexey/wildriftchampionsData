import AuthProviderIcon from "@/components/icons/AuthProviderIcon";
import styles from "./LinkedProviderIcons.module.css";

type LinkedIdentity = {
  id?: number | string;
  provider?: string;
  email?: string;
  username?: string;
  name?: string;
  subject?: string;
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

function getIdentityTitle(identity: LinkedIdentity) {
  const providerId = identity.provider || "user";
  const meta = identity.name || identity.email || identity.username || identity.subject || "";
  return meta ? `${getProviderLabel(providerId)}: ${meta}` : getProviderLabel(providerId);
}

export default function LinkedProviderIcons({
  identities,
  emptyText = "Пока нет привязанных входов.",
}: {
  identities?: LinkedIdentity[] | null;
  emptyText?: string;
}) {
  if (!Array.isArray(identities) || identities.length === 0) {
    return <p className={styles.empty}>{emptyText}</p>;
  }

  return (
    <div className={styles.list}>
      {identities.map((identity) => {
        const providerId = identity.provider || "user";
        const key = String(identity.id || `${providerId}-${identity.subject || identity.email || identity.username || "linked"}`);
        return (
          <span
            key={key}
            className={styles.item}
            title={getIdentityTitle(identity)}
            aria-label={`${getProviderLabel(providerId)} подключен`}
          >
            <span className={styles.iconWrap}>
              <AuthProviderIcon
                providerId={providerId}
                className={styles.iconGraphic}
              />
            </span>
          </span>
        );
      })}
    </div>
  );
}
