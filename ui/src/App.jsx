// ui/src/App.jsx
import { useEffect, useState } from "react";
import { WinrateScreen } from "./screens/WinrateScreen.jsx";
import TrendScreen from "./screens/TrendScreen.jsx";
import MenuButton from "./components/MenuButton.jsx";
import { formatDateTime } from "./utils/formatDate.js";

import {
  BASE_COLORS,
  BUTTON_GRADIENTS,
  resolveTgColor,
  styles,
} from "./theme.js";

import Footer from "./components/Footer.jsx";
import TopPicksBansScreen from "./screens/TopPicksBansScreen.jsx";

const VIEWS = {
  MENU: "menu",
  WINRATES: "winrates",
  GRAPH: "graph",
  PICKS_BANS: "picks_bans",
};

function App() {
  const [tg, setTg] = useState(null);
  const [language] = useState("ru_ru");
  const [view, setView] = useState(VIEWS.MENU);
  const [updatedAt, setUpdatedAt] = useState(null);

  // INIT Telegram WebApp
  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      setTg(webApp);
      webApp.ready();
      webApp.expand();
    }
  }, []);

  // Загружаем дату обновления файла
  useEffect(() => {
    fetch("/cn-combined.json")
      .then((res) => res.json())
      .then((data) => setUpdatedAt(data.updatedAt?.split("T")[0] || null))
      .catch(() => {});
  }, []);

  const bg = resolveTgColor(tg, "bg_color", BASE_COLORS.background);
  const textColor = resolveTgColor(tg, "text_color", BASE_COLORS.text);
  const hintColor = resolveTgColor(tg, "hint_color", BASE_COLORS.hint);

  const renderMenu = () => (
    <div style={styles.menuWrapper}>
      <h1 style={styles.title}>Wild Rift Stats</h1>

      <div style={styles.subtitle}>
        Выбери раздел. Активны: винрейты, топ пики/баны, график трендов.
      </div>

      <MenuButton
        title="Статистика винрейтов"
        subtitle={<>Обновлено {formatDateTime(updatedAt)}</>}
        onClick={() => setView(VIEWS.WINRATES)}
        gradient={BUTTON_GRADIENTS.blue}
      />

      <MenuButton
        title="Топ пики / баны"
        subtitle="Самые популярные и банимые чемпионы"
        onClick={() => setView(VIEWS.PICKS_BANS)}
        gradient={BUTTON_GRADIENTS.green}
      />

      <MenuButton
        title="График трендов"
        subtitle="Изменение винрейтов по времени"
        onClick={() => setView(VIEWS.GRAPH)}
        gradient={BUTTON_GRADIENTS.orange}
      />

      <div style={styles.futureBlock(hintColor)}>
        Будущие разделы: чемпионы, билды, гайды
      </div>
    </div>
  );

  const renderContent = () => {
    switch (view) {
      case VIEWS.MENU:
        return renderMenu();

      case VIEWS.WINRATES:
        return (
          <WinrateScreen
            language={language}
            onBack={() => setView(VIEWS.MENU)}
          />
        );

      case VIEWS.PICKS_BANS:
        return (
          <TopPicksBansScreen
            language={language}
            onBack={() => setView(VIEWS.MENU)}
          />
        );

      case VIEWS.GRAPH:
        return <TrendScreen onBack={() => setView(VIEWS.MENU)} />;

      default:
        return null;
    }
  };

  return (
    <div style={styles.app(bg, textColor)}>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {renderContent()}
      </div>

      <Footer />
    </div>
  );
}

export default App;
