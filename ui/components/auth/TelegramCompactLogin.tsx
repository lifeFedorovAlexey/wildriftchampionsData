"use client";

import { useEffect, useRef, useState } from "react";
import AuthProviderIcon from "@/components/icons/AuthProviderIcon";
import TelegramLoginButton from "@/components/admin/TelegramLoginButton";
import styles from "./AuthProvidersList.module.css";

type TelegramCompactLoginProps = {
  botUsername: string;
  authUrl: string;
  webAppActionUrl?: string;
  returnTo?: string;
  label?: string;
};

export default function TelegramCompactLogin({
  botUsername,
  authUrl,
  webAppActionUrl = "",
  returnTo = "",
  label = "Telegram",
}: TelegramCompactLoginProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.telegramCompactWrap}>
      <button
        type="button"
        className={styles.iconOnlyLink}
        aria-label={label}
        title={label}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={`${styles.iconBox} ${styles.iconOnlyBox}`.trim()} aria-hidden="true">
          <AuthProviderIcon providerId="telegram" className={styles.iconOnlyGraphic} />
        </span>
      </button>

      {open ? (
        <div className={styles.telegramCompactOverlay}>
          <div ref={panelRef} className={styles.telegramCompactPanel}>
            <div className={styles.telegramCompactHead}>
              <div className={styles.telegramCompactMeta}>
                <span className={styles.iconBox} aria-hidden="true">
                  <AuthProviderIcon providerId="telegram" className={styles.iconGraphic} />
                </span>
                <div className={styles.copy}>
                  <h3 className={styles.title}>Telegram</h3>
                  <p className={styles.hint}>Вход через Telegram.</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.telegramCompactClose}
                aria-label="Закрыть Telegram вход"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.telegramCompactBody}>
              <TelegramLoginButton
                botUsername={botUsername}
                authUrl={authUrl}
                webAppActionUrl={webAppActionUrl}
                returnTo={returnTo}
                size="large"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
