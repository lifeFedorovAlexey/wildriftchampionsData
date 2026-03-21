export type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export type TelegramWebApp = {
  ready?: () => void;
  expand?: () => void;
  openLink?: (url: string) => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setColorScheme?: (scheme: "light" | "dark") => void;
  initData?: string;
  initDataUnsafe?: {
    user?: TelegramUser;
  };
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
};

export const TELEGRAM_WEBAPP_READY_EVENT = "telegram-webapp-ready";

export function getTelegramWebApp() {
  if (typeof window === "undefined") return undefined;

  return (window as TelegramWindow).Telegram?.WebApp;
}

export function initTelegramWebAppAppearance() {
  const webApp = getTelegramWebApp();
  if (!webApp) return false;

  webApp.ready?.();
  webApp.expand?.();

  try {
    webApp.setHeaderColor?.("#0b1220");
    webApp.setBackgroundColor?.("#0b1220");
    webApp.setColorScheme?.("dark");
  } catch {}

  return true;
}
