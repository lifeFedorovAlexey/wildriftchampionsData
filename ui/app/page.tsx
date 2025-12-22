import PageWrapper from "@/components/PageWrapper";
import Footer from "@/components/Footer";
import MenuButton from "@/components/MenuButton";
import {
  IconWinrate,
  IconTierInq,
  IconTierlist,
  IconPicksBans,
  IconTrends,
} from "@/components/icons/MenuIcons";

const BUTTON_GRADIENTS = {
  blue: "linear-gradient(135deg, rgba(56,189,248,0.16), rgba(129,140,248,0.32))",
  green:
    "linear-gradient(135deg, rgba(16,185,129,0.16), rgba(52,211,153,0.32))",
  purple:
    "linear-gradient(135deg, rgba(139,92,246,0.18), rgba(168,85,247,0.3))",
  gold: "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(251,191,36,0.34))",
  crimson:
    "linear-gradient(135deg, rgba(239,68,68,0.18), rgba(248,113,113,0.34))",
};

export default function HomePage() {
  return (
    <PageWrapper>
      <div style={{ display: "grid", gap: 10 }}>
        <MenuButton
          title="Статистика Чемпионов"
          subtitle="Винрейты, пики, баны по линиям и рангам"
          href="/winrates"
          gradient={BUTTON_GRADIENTS.blue}
          leftIcon={<IconWinrate />}
        />

        <MenuButton
          title="Тир-лист (авторский)"
          subtitle="Формулы при поддержке INQ"
          href="/tier-inq"
          gradient={BUTTON_GRADIENTS.crimson}
          leftIcon={<IconTierInq />}
        />

        <MenuButton
          title="Тир-лист (по статистике)"
          subtitle="Формируется из strength level"
          href="/tierlist"
          gradient={BUTTON_GRADIENTS.gold}
          leftIcon={<IconTierlist />}
        />

        <MenuButton
          title="Топ пики / баны"
          subtitle="Самые популярные и банимые чемпионы"
          href="/picks-bans"
          gradient={BUTTON_GRADIENTS.green}
          leftIcon={<IconPicksBans />}
        />

        <MenuButton
          title="График трендов"
          subtitle="Изменение винрейтов по времени"
          href="/trends"
          gradient={BUTTON_GRADIENTS.purple}
          leftIcon={<IconTrends />}
        />
      </div>

      <div style={{ marginTop: 18 }}>
        <Footer />
      </div>
    </PageWrapper>
  );
}
