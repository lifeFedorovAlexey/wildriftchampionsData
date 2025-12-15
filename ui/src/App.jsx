// ui/src/App.jsx
import { useEffect, useState } from "react";
import { WinrateScreen } from "./screens/WinrateScreen.jsx";
import TierlistScreenInq from "./screens/TierlistScreenInq.jsx";
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
  WINRATES_INQ: "winrates_inq",
  TIERLIST: "tierlist",
  GRAPH: "graph",
  PICKS_BANS: "picks_bans",
};

const API_BASE = "https://wr-api.vercel.app";
const INQ_TWITCH_URL = "https://www.twitch.tv/inq_wr";

/* ---------- Menu icons (LoL/Wild Rift vibe, mono via currentColor) ---------- */

function IconWinrate({ size = 22 }) {
  // podium 1-2-3 (winrate / ranking)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block" }}
    >
      {/* left step (2) */}
      <rect x="3" y="12" width="5" height="7" rx="1.5" />
      {/* center step (1) */}
      <rect x="9.5" y="8" width="5" height="11" rx="1.5" />
      {/* right step (3) */}
      <rect x="16" y="14" width="5" height="5" rx="1.5" />
    </svg>
  );
}

function IconTierInq({ size = 22 }) {
  // crown
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block" }}
    >
      <path d="M3 7l4 4 5-6 5 6 4-4v10H3V7zm0 12h18v2H3v-2z" />
    </svg>
  );
}

function IconTierlist({ size = 22 }) {
  // Great Wall (CN tierlist)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block" }}
    >
      {/* wall base */}
      <rect x="2" y="12" width="20" height="5" rx="1.2" />

      {/* battlements */}
      <rect x="3" y="9" width="4" height="3" rx="0.8" />
      <rect x="10" y="9" width="4" height="3" rx="0.8" />
      <rect x="17" y="9" width="4" height="3" rx="0.8" />
    </svg>
  );
}

function IconPicksBans({ size = 22 }) {
  // sniper crosshair (pick / ban target)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block" }}
    >
      {/* outer ring */}
      <circle
        cx="12"
        cy="12"
        r="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />

      {/* vertical line */}
      <line
        x1="12"
        y1="3"
        x2="12"
        y2="7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="12"
        y1="17"
        x2="12"
        y2="21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* horizontal line */}
      <line
        x1="3"
        y1="12"
        x2="7"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="17"
        y1="12"
        x2="21"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* center dot */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IconTrends({ size = 22 }) {
  // rising chart
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block" }}
    >
      <path d="M3 17l6-6 4 4 7-7v4h2V4h-8v2h4l-5 5-4-4-7 7z" />
    </svg>
  );
}

function App() {
  const [tg, setTg] = useState(null);
  const [language] = useState("ru_ru");
  const [view, setView] = useState(VIEWS.MENU);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      setTg(webApp);
      webApp.ready();
      webApp.expand();
    }
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
