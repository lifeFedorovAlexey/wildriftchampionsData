"use client";

import { useEffect, useRef, useState } from "react";
import TextHint from "@/components/TextHint";

type TelegramLoginButtonProps = {
  botUsername: string;
  authUrl: string;
};

export default function TelegramLoginButton({
  botUsername,
  authUrl,
}: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isLocalHost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");
  const [loadError, setLoadError] = useState("");
  const visibleError = isLocalHost
    ? "Telegram login локально не рендерится: проверь его на домене бота."
    : loadError;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !botUsername || !authUrl) return undefined;

    if (isLocalHost) {
      container.innerHTML = "";
      return undefined;
    }

    container.innerHTML = "";

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "10");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-auth-url", authUrl);
    script.setAttribute("data-request-access", "write");
    script.onerror = () => {
      setLoadError("Не удалось загрузить Telegram widget.");
    };

    container.appendChild(script);

    const timer = window.setTimeout(() => {
      const textContent = (container.textContent || "").trim();
      if (/bot domain invalid/i.test(textContent)) {
        setLoadError(
          "Telegram login доступен только на домене, который привязан к боту.",
        );
        container.innerHTML = "";
      }
    }, 1200);

    return () => {
      window.clearTimeout(timer);
      container.innerHTML = "";
    };
  }, [authUrl, botUsername, isLocalHost]);

  if (visibleError) {
    return <TextHint>{visibleError}</TextHint>;
  }

  return <div ref={containerRef} className="telegramWidgetHost" />;
}
