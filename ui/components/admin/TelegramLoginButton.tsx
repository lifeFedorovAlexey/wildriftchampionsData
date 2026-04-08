"use client";

import { useEffect, useRef, useState } from "react";
import TextHint from "@/components/TextHint";
import {
  getTelegramWebApp,
  isLikelyTelegramWebAppEnvironment,
  TELEGRAM_WEBAPP_READY_EVENT,
} from "@/lib/telegram-webapp";

type TelegramLoginButtonProps = {
  botUsername: string;
  authUrl: string;
  size?: "large" | "medium" | "small";
  webAppActionUrl?: string;
  returnTo?: string;
  actionLabel?: string;
};

export default function TelegramLoginButton({
  botUsername,
  authUrl,
  size = "large",
  webAppActionUrl = "",
  returnTo = "",
  actionLabel = "Войти через Telegram",
}: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isLocalHost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");
  const [loadError, setLoadError] = useState("");
  const [isTelegramWebApp, setIsTelegramWebApp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const visibleError = isLocalHost
    ? "Telegram login локально не рендерится: проверь его на домене бота."
    : loadError;

  useEffect(() => {
    const syncMode = () => {
      const webApp = getTelegramWebApp();
      const hasInitData =
        typeof webApp?.initData === "string" && webApp.initData.trim().length > 0;
      const hasUser = Boolean(webApp?.initDataUnsafe?.user);
      setIsTelegramWebApp(hasInitData || hasUser);
    };

    syncMode();
    window.addEventListener(TELEGRAM_WEBAPP_READY_EVENT, syncMode);

    return () => {
      window.removeEventListener(TELEGRAM_WEBAPP_READY_EVENT, syncMode);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !botUsername || !authUrl) return undefined;

    if (isLocalHost || isTelegramWebApp) {
      container.innerHTML = "";
      return undefined;
    }

    container.innerHTML = "";

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", size);
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
  }, [authUrl, botUsername, isLocalHost, isTelegramWebApp, size]);

  async function handleTelegramWebAppLogin() {
    setLoadError("");

    if (!webAppActionUrl) {
      setLoadError("Telegram WebApp login пока не настроен.");
      return;
    }

    const initData = String(getTelegramWebApp()?.initData || "").trim();
    if (!initData) {
      setLoadError("Открой страницу через кнопку бота внутри Telegram.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(webAppActionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ initData, returnTo }),
        cache: "no-store",
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        setLoadError("Не удалось выполнить вход через Telegram.");
        if (payload?.redirectTo) {
          window.location.assign(payload.redirectTo);
        }
        return;
      }

      window.location.assign(payload.redirectTo || returnTo || "/");
    } catch {
      setLoadError("Не удалось выполнить вход через Telegram.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (visibleError) {
    return <TextHint>{visibleError}</TextHint>;
  }

  if (isTelegramWebApp && isLikelyTelegramWebAppEnvironment()) {
    return (
      <button
        type="button"
        onClick={handleTelegramWebAppLogin}
        disabled={isSubmitting}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: size === "small" ? 40 : 46,
          width: "100%",
          padding: "0 16px",
          border: 0,
          borderRadius: 14,
          background: "linear-gradient(135deg, #f5d36c, #ff9b57)",
          color: "#10151f",
          fontSize: 14,
          fontWeight: 800,
          cursor: isSubmitting ? "wait" : "pointer",
          opacity: isSubmitting ? 0.72 : 1,
        }}
      >
        {isSubmitting ? "Входим..." : actionLabel}
      </button>
    );
  }

  return <div ref={containerRef} className="telegramWidgetHost" />;
}
