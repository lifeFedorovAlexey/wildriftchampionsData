// ui/src/App.jsx
import { useEffect, useState } from "react";
import { WinrateScreen } from "./screens/WinrateScreen.jsx";
import TierlistScreenInq from "./screens/TierlistScreenInq.jsx";
import TrendScreen from "./screens/TrendScreen.jsx";
import MenuButton from "./components/MenuButton.jsx";
import { formatDateTime } from "./utils/formatDate.js";

import { BASE_COLORS, BUTTON_GRADIENTS, styles } from "./theme.js";

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
import {
  IconWinrate,
  IconTierInq,
  IconTierlist,
  IconPicksBans,
  IconTrends,
} from "./components/icons/Menu/index.tsx";

import { API_BASE, INQ_TWITCH_URL } from "./constants.js";

const VIEWS = {
  MENU: "menu",
  WINRATES: "winrates",
  WINRATES_INQ: "winrates_inq",
  TIERLIST: "tierlist",
  GRAPH: "graph",
  PICKS_BANS: "picks_bans",
};

function App() {
  const [tg, setTg] = useState(null);
  const [language] = useState("ru_ru");
  const [view, setView] = useState(VIEWS.MENU);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp) return;

    setTg(webApp);
    webApp.ready();
    webApp.expand();

    // Принудительно тёмное оформление со стороны Telegram (чтоб светлая тема не “подсвечивала”)
    try {
      if (typeof webApp.setHeaderColor === "function") {
        webApp.setHeaderColor("#0b1220");
      }
      if (typeof webApp.setBackgroundColor === "function") {
        webApp.setBackgroundColor("#0b1220");
      }
      // Не везде есть, но если есть — отлично
      if (typeof webApp.setColorScheme === "function") {
        webApp.setColorScheme("dark");
      }
    } catch {}
  }, []);

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

  useEffect(() => {
    let cancelled = false;

    async function loadUpdatedAt() {
      try {
        const res = await fetch(`${API_BASE}/api/updated-at`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setUpdatedAt(data.updatedAt || null);
      } catch {}
    }

    loadUpdatedAt();
    return () => {
      cancelled = true;
    };
  }, []);

  // 🔒 Всегда тёмная тема — игнорируем Telegram themeParams
  const bg = BASE_COLORS.background;
  const textColor = BASE_COLORS.text;
  const hintColor = BASE_COLORS.hint;

  function openLink(url) {
    if (!url) return;
    try {
      if (tg?.openLink) tg.openLink(url);
      else window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  function openInqTwitch() {
    openLink(INQ_TWITCH_URL);
  }

  const renderMenu = () => (
    <MenuWrapper>
      <MenuTitle>Wild Rift Stats</MenuTitle>

      <MenuSubtitle>
        Выбери раздел. Активны: винрейты, тир-лист, топ пики/баны, график
        трендов.
      </MenuSubtitle>

      <MenuButton
        title="Винрейт чемпионов CN"
        subtitle={
          updatedAt ? (
            <>Обновлено {formatDateTime(updatedAt)}</>
          ) : (
            "Дата обновления недоступна"
          )
        }
        onClick={() => setView(VIEWS.WINRATES)}
        gradient={BUTTON_GRADIENTS.blue}
        leftIcon={<IconWinrate />}
      />

      <MenuButton
        title="Тир-лист чемпионов стримера INQ"
        subtitle={
          updatedAt ? (
            <>Обновлено {formatDateTime(updatedAt)}</>
          ) : (
            "Дата обновления недоступна"
          )
        }
        onClick={() => setView(VIEWS.WINRATES_INQ)}
        gradient={BUTTON_GRADIENTS.crimson}
        leftIcon={<IconTierInq />}
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
        gradient={BUTTON_GRADIENTS.gold}
        leftIcon={<IconTierlist />}
      />

      <MenuButton
        title="Топ пики / баны"
        subtitle="Самые популярные и банимые чемпионы"
        onClick={() => setView(VIEWS.PICKS_BANS)}
        gradient={BUTTON_GRADIENTS.green}
        leftIcon={<IconPicksBans />}
      />

      <MenuButton
        title="График трендов"
        subtitle="Изменение винрейтов по времени"
        onClick={() => setView(VIEWS.GRAPH)}
        gradient={BUTTON_GRADIENTS.purple}
        leftIcon={<IconTrends />}
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
      case VIEWS.WINRATES_INQ:
        return (
          <TierlistScreenInq
            language={language}
            onBack={() => setView(VIEWS.MENU)}
            onOpenInq={openInqTwitch}
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
