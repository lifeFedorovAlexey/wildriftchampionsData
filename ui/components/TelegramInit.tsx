"use client";

import { useEffect } from "react";
import { getTelegramWebApp } from "@/lib/telegram-webapp";

export default function TelegramInit() {
  useEffect(() => {
    const webApp = getTelegramWebApp();
    if (!webApp) return;

    webApp.ready?.();
    webApp.expand?.();

    try {
      webApp.setHeaderColor?.("#0b1220");
      webApp.setBackgroundColor?.("#0b1220");
      webApp.setColorScheme?.("dark");
    } catch {}
  }, []);

  return null;
}
