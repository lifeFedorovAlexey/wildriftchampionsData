import type { Metadata } from "next";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import "./globals.css";
import TelegramInit from "@/components/TelegramInit";
import YandexMetrikaInit from "@/components/YandexMetrikaInit";
import StyledComponentsRegistry from "./StyledComponentsRegistry";

export const metadata: Metadata = {
  metadataBase: new URL("https://wildriftallstats.ru"),
  title: {
    default: "Wild Rift Stats — тир-лист, винрейты, пики и баны",
    template: "%s — Wild Rift Stats",
  },
  description:
    "Актуальная статистика Wild Rift: тир-лист чемпионов по линиям и рангам, винрейты, пики и баны. Обновляется ежедневно.",
  keywords: [
    "Wild Rift",
    "Wild Rift статистика",
    "WR",
    "WR статистика",
    "WR винрейт",
    "WR пикрейт",
    "WR банрейт",
    "пики и баны WR",
    "WR тирлист",
    "мета WR",
    "статистика Wild Rift",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Wild Rift Stats",
    description:
      "Тир-лист, винрейты, пики и баны чемпионов Wild Rift. Обновление каждый день.",
    url: "/",
    siteName: "Wild Rift Stats",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wild Rift Stats",
    description:
      "Тир-лист, винрейты, пики и баны чемпионов Wild Rift. Обновление каждый день.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark" />
      </head>

      <body>
        <TelegramInit />
        <YandexMetrikaInit />
        <StyledComponentsRegistry>
          <AppHeader />
          {children}
          <Footer />
        </StyledComponentsRegistry>

        <noscript>
          <div>
            <img
              src="https://mc.yandex.ru/watch/106001120"
              style={{ position: "absolute", left: "-9999px" }}
              alt=""
            />
          </div>
        </noscript>
      </body>
    </html>
  );
}
