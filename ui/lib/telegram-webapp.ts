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

export function getTelegramWebApp() {
  if (typeof window === "undefined") return undefined;

  return (window as TelegramWindow).Telegram?.WebApp;
}
