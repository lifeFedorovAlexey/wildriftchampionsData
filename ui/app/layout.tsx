import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import TelegramInit from "@/components/TelegramInit";

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
    "WR",
    "мобильный лол",
    "mobile legends of league",
    "тирлист WR",
    "wr тирлист",
    "винрейты Wild Rift",
    "пики и баны WR",
    "топ пики WR",
    "мета Wild Rift",
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
        <link
          rel="preconnect"
          href="https://game.gtimg.cn"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="//game.gtimg.cn" />
      </head>

      <body>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <TelegramInit />
        {children}
      </body>
    </html>
  );
}
