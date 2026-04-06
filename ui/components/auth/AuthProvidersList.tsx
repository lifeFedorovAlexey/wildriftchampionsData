import Link from "next/link";
import TelegramLoginButton from "@/components/admin/TelegramLoginButton";
import AuthProviderIcon from "@/components/icons/AuthProviderIcon";
import styles from "./AuthProvidersList.module.css";

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

type AuthProvidersListProps = {
  providers: ProviderCard[];
  telegramProvider?: TelegramProvider | null;
  returnTo?: string;
  mode?: "login" | "connect";
  layout?: "grid" | "stack";
  compact?: boolean;
  iconOnly?: boolean;
  showStatus?: boolean;
  emptyText?: string;
};

function buildHref(startHref: string, returnTo?: string) {
  if (!returnTo) return startHref;
  const separator = startHref.includes("?") ? "&" : "?";
  return `${startHref}${separator}returnTo=${encodeURIComponent(returnTo)}`;
}

function getActionLabel(mode: "login" | "connect", label: string) {
  return mode === "connect" ? "Подключить" : `Войти через ${label}`;
}

function getHint(
  providerId: string,
  enabled: boolean,
  mode: "login" | "connect",
) {
  if (providerId === "telegram") {
    if (!enabled) return "Нужен Telegram bot";
    return mode === "connect"
      ? "Привяжется к текущему профилю."
      : "Вход через официальный Telegram widget.";
  }

  if (!enabled) {
    return mode === "connect"
      ? "Этот провайдер пока не настроен."
      : "Провайдер пока не настроен.";
  }

  return mode === "connect"
    ? "Можно подвязать прямо сейчас."
    : "Обычный OAuth-вход без лишней магии.";
}

function renderItem(
  provider: ProviderCard,
  telegramProvider: TelegramProvider | null | undefined,
  mode: "login" | "connect",
  returnTo: string | undefined,
  compact: boolean,
  iconOnly: boolean,
  showStatus: boolean,
) {
  const itemClassName = compact
    ? `${styles.row} ${styles.rowCompact}`.trim()
    : mode === "login"
      ? styles.card
      : styles.row;
  const actionClassName = compact ? styles.actionCompact : styles.action;

  const actionHref = buildHref(provider.startHref, returnTo);
  const telegramEnabled = Boolean(
    telegramProvider?.enabled &&
      telegramProvider.botUsername &&
      telegramProvider.authUrl,
  );

  return (
    <article key={provider.id} className={itemClassName}>
      <div className={compact ? styles.head : styles.meta}>
        <div className={styles.titleWrap}>
          <span
            className={`${styles.iconBox} ${compact ? styles.iconBoxCompactOnly : ""}`.trim()}
            aria-hidden="true"
          >
            <AuthProviderIcon providerId={provider.id} className={styles.iconGraphic} />
          </span>
          {!compact && !iconOnly ? (
            <div className={styles.copy}>
              <h3 className={styles.title}>{provider.label}</h3>
              <p className={styles.hint}>{getHint(provider.id, provider.enabled, mode)}</p>
            </div>
          ) : null}
        </div>
        {showStatus ? (
          <span
            className={`${styles.badge} ${provider.enabled ? "" : styles.badgeMuted}`.trim()}
          >
            {provider.enabled ? "Готов" : "Не настроен"}
          </span>
        ) : null}
      </div>

      {provider.id === "telegram" ? (
        telegramEnabled ? (
          <div className={`${compact ? styles.widgetWrapCompact : styles.widgetWrap} ${actionClassName}`.trim()}>
            <TelegramLoginButton
              botUsername={telegramProvider?.botUsername || ""}
              authUrl={telegramProvider?.authUrl || ""}
              size={compact ? "large" : "large"}
            />
          </div>
        ) : (
          <div className={`${styles.mutedAction} ${actionClassName}`.trim()}>Нужен Telegram bot</div>
        )
      ) : (
        <Link
          href={actionHref}
          className={`${styles.button} ${actionClassName} ${provider.enabled ? "" : styles.buttonDisabled}`.trim()}
        >
          {getActionLabel(mode, provider.label)}
        </Link>
      )}
    </article>
  );
}

export default function AuthProvidersList({
  providers,
  telegramProvider = null,
  returnTo,
  mode = "login",
  layout = "stack",
  compact = false,
  iconOnly = false,
  showStatus = false,
  emptyText = "",
}: AuthProvidersListProps) {
  const allProviders = [...providers];

  if (telegramProvider) {
    allProviders.push({
      id: "telegram",
      label: "Telegram",
      enabled: Boolean(telegramProvider.enabled),
      startHref: "",
    });
  }

  if (!allProviders.length) {
    return emptyText ? <p className={styles.hint}>{emptyText}</p> : null;
  }

  return (
    <div className={layout === "grid" ? styles.grid : styles.stack}>
      {allProviders.map((provider) =>
        renderItem(
          provider,
          provider.id === "telegram" ? telegramProvider : null,
          mode,
          returnTo,
          compact,
          iconOnly,
          showStatus,
        ),
      )}
    </div>
  );
}
