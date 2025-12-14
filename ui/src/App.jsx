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
import TierlistScreen from "./screens/TierlistScreen.jsx";

import {
  AppRoot,
  AppMain,
  AppShell,
} from "./components/styled/AppLayout.styled.js";
import {
  MenuWrapper,
  MenuTitle,
  MenuSubtitle,
  FutureBlock,
} from "./components/styled/Menu.styled.js";

const VIEWS = {
  MENU: "menu",
  WINRATES: "winrates",
  TIERLIST: "tierlist",
  GRAPH: "graph",
  PICKS_BANS: "picks_bans",
};

const API_BASE = "https://wr-api-pjtu.vercel.app";

function App() {
  const [tg, setTg] = useState(null);
  const [language] = useState("ru_ru");
  const [view, setView] = useState(VIEWS.MENU);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      console.log("[App] Telegram.WebApp найден");
      setTg(webApp);
      webApp.ready();
      webApp.expand();
    } else {
      console.log("[App] Telegram.WebApp НЕ найден");
    }
  }, []);

  useEffect(() => {
    if (!tg) return;

    const user = tg.initDataUnsafe?.user;
    console.log("[App] initDataUnsafe.user =", user);
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
    })
      .then((res) => {
        if (!res.ok) console.log("[webapp-open] bad status", res.status);
        else console.log("[webapp-open] ok");
      })
      .catch((err) => console.log("[webapp-open] fetch error", err));
  }, [tg]);

  useEffect(() => {
    let cancelled = false;

    async function loadUpdatedAt() {
      try {
        const res = await fetch(`${API_BASE}/api/updated-at`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        setUpdatedAt(data.updatedAt || null);
      } catch {
        // тихо игнорим
      }
    }

    loadUpdatedAt();
    return () => {
      cancelled = true;
    };
  }, []);

  const bg = resolveTgColor(tg, "bg_color", BASE_COLORS.background);
  const textColor = resolveTgColor(tg, "text_color", BASE_COLORS.text);
  const hintColor = resolveTgColor(tg, "hint_color", BASE_COLORS.hint);

  const renderMenu = () => (
    <MenuWrapper>
      <MenuTitle>Wild Rift Stats</MenuTitle>

      <MenuSubtitle>
        Выбери раздел. Активны: винрейты, тир-лист, топ пики/баны, график
        трендов.
      </MenuSubtitle>

      <MenuButton
        title="Статистика винрейтов"
        subtitle={
          updatedAt ? (
            <>Обновлено {formatDateTime(updatedAt)}</>
          ) : (
            "Дата обновления недоступна"
          )
        }
        onClick={() => setView(VIEWS.WINRATES)}
        gradient={BUTTON_GRADIENTS.blue}
      />

      <MenuButton
        title="Тир-лист чемпионов"
        subtitle={
          updatedAt ? (
            <>Тир по strength level, {formatDateTime(updatedAt)}</>
          ) : (
            "На основе актуальной статистики"
          )
        }
        onClick={() => setView(VIEWS.TIERLIST)}
        gradient={BUTTON_GRADIENTS.purple || BUTTON_GRADIENTS.orange}
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

      <FutureBlock $hintColor={hintColor}>
        Будущие разделы: чемпионы, билды, гайды
      </FutureBlock>
    </MenuWrapper>
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

      case VIEWS.TIERLIST:
        return (
          <TierlistScreen
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
    <AppRoot style={styles.app(bg, textColor)}>
      <AppMain>
        <AppShell>{renderContent()}</AppShell>
      </AppMain>

      <Footer />
    </AppRoot>
  );
}

export default App;
