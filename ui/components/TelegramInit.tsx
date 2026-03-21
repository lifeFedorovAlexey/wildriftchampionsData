"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import {
  TELEGRAM_WEBAPP_READY_EVENT,
  initTelegramWebAppAppearance,
} from "@/lib/telegram-webapp";

export default function TelegramInit() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded && !initTelegramWebAppAppearance()) return;

    window.dispatchEvent(new Event(TELEGRAM_WEBAPP_READY_EVENT));
  }, [loaded]);

  return (
    <Script
      src="https://telegram.org/js/telegram-web-app.js"
      strategy="afterInteractive"
      onLoad={() => setLoaded(true)}
    />
  );
}
