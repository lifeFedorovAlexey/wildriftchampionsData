import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import TelegramInit from "@/components/TelegramInit";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
    "WR пики и баны",
    "тирлист WR",
    "WR тирлист",
    "мета WR",
    "топ чемпионы WR",
    "топ пики WR",
    "винрейты Wild Rift",
    "пикрейт Wild Rift",
    "банрейт Wild Rift",
    "мета Wild Rift",
    "статистика Wild Rift",
    "статистика чемпионов Wild Rift",
    "лучшие чемпионы Wild Rift",
    "что пикать в Wild Rift",
    "что банить в Wild Rift",
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

        {/* Yandex.Metrika */}
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`
            (function(m,e,t,r,i,k,a){
              m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {
                if (document.scripts[j].src === r) { return; }
              }
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],
              k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
            })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=106001120', 'ym');

            ym(106001120, 'init', {
              ssr:true,
              webvisor:true,
              clickmap:true,
              ecommerce:"dataLayer",
              accurateTrackBounce:true,
              trackLinks:true
            });
          `}
        </Script>
        {/* /Yandex.Metrika */}
      </head>

      <body>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />

        <TelegramInit />

        {children}

        <SpeedInsights />

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
