"use client";

import { useEffect } from "react";

export default function TelegramInit() {
  useEffect(() => {
    const webApp = (window as any).Telegram?.WebApp;
    if (!webApp) return;

    webApp.ready();
    webApp.expand();

    try {
      if (typeof webApp.setHeaderColor === "function")
        webApp.setHeaderColor("#0b1220");
      if (typeof webApp.setBackgroundColor === "function")
        webApp.setBackgroundColor("#0b1220");
      if (typeof webApp.setColorScheme === "function")
        webApp.setColorScheme("dark");
    } catch {}
  }, []);

  return null;
}
