"use client";

import { useEffect, useState } from "react";
import {
  getTelegramWebApp,
  initTelegramWebAppAppearance,
  TELEGRAM_WEBAPP_READY_EVENT,
} from "@/lib/telegram-webapp";
import { API_BASE, INQ_TWITCH_URL } from "@/constants/apiBase";

const VIEWS = {
  MENU: "menu",
  WINRATES: "winrates",
  WINRATES_INQ: "winrates_inq",
  TIERLIST: "tierlist",
  GRAPH: "graph",
  PICKS_BANS: "picks_bans",
};

function ScreenView({ title, onBack }) {
  return (
    <div style={{ padding: 16 }}>
      <button onClick={onBack} style={{ marginBottom: 12 }}>
        ← Назад
      </button>
      <h1 style={{ margin: 0 }}>{title}</h1>
      <p style={{ opacity: 0.8 }}>
        Тут потом подключим реальный экран. Сейчас важнее, что проект живой.
      </p>
    </div>
  );
}

function MenuButton({ title, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: 14,
        marginBottom: 10,
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.04)",
        color: "#e8ecff",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      {title}
    </button>
  );
}

export default function AppClient() {
  const [view, setView] = useState(VIEWS.MENU);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [telegramReadyTick, setTelegramReadyTick] = useState(0);
  const tg = getTelegramWebApp() ?? null;

  useEffect(() => {
    const onTelegramReady = () => {
      setTelegramReadyTick((tick) => tick + 1);
    };

    onTelegramReady();
    window.addEventListener(TELEGRAM_WEBAPP_READY_EVENT, onTelegramReady);

    return () => {
      window.removeEventListener(TELEGRAM_WEBAPP_READY_EVENT, onTelegramReady);
    };
  }, []);

  useEffect(() => {
    if (!tg) return;
    initTelegramWebAppAppearance();
  }, [tg, telegramReadyTick]);

  useEffect(() => {
    const user = tg?.initDataUnsafe?.user;
    if (!user) return;

    fetch(`${API_BASE}/api/webapp-open`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tgId: user.id,
        username: user.username || null,
        firstName: user.first_name || null,
        lastName: user.last_name || null,
      }),
    }).catch(() => {});
  }, [tg, telegramReadyTick]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/updated-at`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setUpdatedAt(data.updatedAt || null);
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function openLink(url) {
    if (!url) return;

    try {
      if (tg?.openLink) {
        tg.openLink(url);
        return;
      }

      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  if (view !== VIEWS.MENU) {
    if (view === VIEWS.WINRATES) {
      return (
        <ScreenView
          title="Статистика чемпионов"
          onBack={() => setView(VIEWS.MENU)}
        />
      );
    }

    if (view === VIEWS.WINRATES_INQ) {
      return (
        <ScreenView
          title="Тир-лист (авторский)"
          onBack={() => setView(VIEWS.MENU)}
        />
      );
    }

    if (view === VIEWS.TIERLIST) {
      return (
        <ScreenView
          title="Тир-лист (по статистике)"
          onBack={() => setView(VIEWS.MENU)}
        />
      );
    }

    if (view === VIEWS.PICKS_BANS) {
      return (
        <ScreenView
          title="Топ пики / баны"
          onBack={() => setView(VIEWS.MENU)}
        />
      );
    }

    if (view === VIEWS.GRAPH) {
      return (
        <ScreenView title="График трендов" onBack={() => setView(VIEWS.MENU)} />
      );
    }
  }

  return (
    <div
      style={{ minHeight: "100vh", background: "#0b0e1c", color: "#e8ecff" }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto", padding: 16 }}>
        <h1 style={{ marginTop: 8, marginBottom: 8 }}>Wild Rift All Stats</h1>

        <div style={{ opacity: 0.8, marginBottom: 16 }}>
          {updatedAt
            ? `Обновлено: ${new Date(updatedAt).toLocaleString("ru-RU")}`
            : "Дата обновления недоступна"}
        </div>

        <MenuButton
          title="Статистика чемпионов"
          onClick={() => setView(VIEWS.WINRATES)}
        />
        <MenuButton
          title="Тир-лист (авторский) — INQ"
          onClick={() => setView(VIEWS.WINRATES_INQ)}
        />
        <MenuButton
          title="Тир-лист (по статистике)"
          onClick={() => setView(VIEWS.TIERLIST)}
        />
        <MenuButton
          title="Топ пики / баны"
          onClick={() => setView(VIEWS.PICKS_BANS)}
        />
        <MenuButton
          title="График трендов"
          onClick={() => setView(VIEWS.GRAPH)}
        />

        <div style={{ marginTop: 16, opacity: 0.8 }}>
          INQ Twitch:{" "}
          <a
            href={INQ_TWITCH_URL}
            onClick={(event) => {
              event.preventDefault();
              openLink(INQ_TWITCH_URL);
            }}
            style={{
              color: "#a98aff",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            {INQ_TWITCH_URL}
          </a>
        </div>
      </div>
    </div>
  );
}
