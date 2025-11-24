// ui/src/App.jsx
import { useEffect, useState } from "react";
import { WinrateScreen } from "./screens/WinrateScreen";

const VIEWS = {
  MENU: "menu",
  WINRATES: "winrates",
};

function App() {
  const [tg, setTg] = useState(null);
  const [language, setLanguage] = useState("ru_ru");
  const [view, setView] = useState(VIEWS.MENU);

  // Telegram WebApp init
  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      setTg(webApp);
      webApp.ready();
      webApp.expand();
    }
  }, []);

  const bg = tg?.themeParams?.bg_color || "#050816";
  const textColor = tg?.themeParams?.text_color || "#ffffff";
  const hintColor = tg?.themeParams?.hint_color || "#9ca3af";

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "10px 10px 12px 10px",
        background: bg,
        color: textColor,
        fontFamily: "system-ui,-apple-system,BlinkMacSystemFont,sans-serif",
        boxSizing: "border-box",
      }}
    >
      {view === VIEWS.MENU && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              margin: 0,
              marginBottom: 4,
            }}
          >
            Wild Rift Stats
          </h1>

          <div
            style={{
              fontSize: 12,
              opacity: 0.75,
              marginBottom: 6,
            }}
          >
            Выбери раздел. Пока живёт только статистика винрейтов, всё остальное
            прячем.
          </div>

          {/* кнопка: статистика винрейтов */}
          <button
            type="button"
            onClick={() => setView(VIEWS.WINRATES)}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              background:
                "linear-gradient(135deg, rgba(56,189,248,0.16), rgba(129,140,248,0.32))",
              color: "inherit",
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 2,
                }}
              >
                Статистика винрейтов
              </div>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.85,
                }}
              >
                Таблица героев по рангу и линии (CN).
              </div>
            </div>
            <span
              style={{
                fontSize: 18,
                opacity: 0.8,
              }}
            >
              →
            </span>
          </button>

          {/* заглушка для будущих разделов */}
          <div
            style={{
              marginTop: 12,
              padding: "8px 10px",
              borderRadius: 10,
              background: "rgba(15,23,42,0.7)",
              fontSize: 12,
              color: hintColor,
            }}
          >
            Будущие разделы (чемпионы, билды, гайды)
          </div>
        </div>
      )}

      {view === VIEWS.WINRATES && (
        <WinrateScreen language={language} onBack={() => setView(VIEWS.MENU)} />
      )}
    </div>
  );
}

export default App;
