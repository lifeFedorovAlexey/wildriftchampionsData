"use client";

import { useEffect, useState } from "react";

const API_BASE = "https://wr-api.vercel.app";
const INQ_TWITCH_URL = "https://www.twitch.tv/inq_wr";

const VIEWS = {
  MENU: "menu",
  WINRATES: "winrates",
  WINRATES_INQ: "winrates_inq",
  TIERLIST: "tierlist",
  GRAPH: "graph",
  PICKS_BANS: "picks_bans",
};

export default function AppClient() {
  const [tg, setTg] = useState(null);
  const [view, setView] = useState(VIEWS.MENU);
  const [updatedAt, setUpdatedAt] = useState(null);

  // Telegram WebApp init (как у тебя было)
  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) return;

    setTg(webApp);
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

  // ping open
  useEffect(() => {
    if (!tg) return;
    const user = tg.initDataUnsafe?.user;
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
  }, [tg]);

  // updatedAt
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
      if (tg?.openLink) tg.openLink(url);
      else window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  // Пока вместо твоих “миллиона импортов” — заглушки экранов
  const Screen = ({ title }) => (
    <div style={{ padding: 16 }}>
      <button onClick={() => setView(VIEWS.MENU)} style={{ marginBottom: 12 }}>
        ← Назад
      </button>
      <h1 style={{ margin: 0 }}>{title}</h1>
      <p style={{ opacity: 0.8 }}>
        Тут потом подключим реальный экран. Сейчас важнее, что проект живой.
      </p>
    </div>
  );

  if (view !== VIEWS.MENU) {
    if (view === VIEWS.WINRATES) return <Screen title="Статистика чемпионов" />;
    if (view === VIEWS.WINRATES_INQ)
      return <Screen title="Тир-лист (авторский)" />;
    if (view === VIEWS.TIERLIST)
      return <Screen title="Тир-лист (по статистике)" />;
    if (view === VIEWS.PICKS_BANS) return <Screen title="Топ пики / баны" />;
    if (view === VIEWS.GRAPH) return <Screen title="График трендов" />;
  }

  return (
    <div
      style={{ minHeight: "100vh", background: "#0b0e1c", color: "#e8ecff" }}
    >
      <div style={{ maxWidth: 560, margin: "0 auto", padding: 16 }}>
        <h1 style={{ marginTop: 8, marginBottom: 8 }}>Wild Rift Stats</h1>

        <div style={{ opacity: 0.8, marginBottom: 16 }}>
          {updatedAt
            ? `Обновлено: ${new Date(updatedAt).toLocaleString("ru-RU")}`
            : "Дата обновления недоступна"}
        </div>

        <MenuButton
          title="Статистика Чемпионов"
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
            onClick={(e) => {
              e.preventDefault();
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
