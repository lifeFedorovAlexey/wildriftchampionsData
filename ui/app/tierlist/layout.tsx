import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Тир-лист WR — мета Wild Rift",
  description:
    "Тир-лист Wild Rift (WR): лучшая мета по линиям и рангам. Кто сейчас топ в мобильном LoL.",
  keywords: [
    "wr тирлист",
    "тирлист WR",
    "tier list Wild Rift",
    "мета Wild Rift",
    "мобильный лол мета",
    "лучшие чемпионы WR",
  ],
  alternates: { canonical: "/tierlist" },
  openGraph: {
    title: "Тир-лист WR — мета Wild Rift",
    description: "Тир-лист Wild Rift по линиям и рангам. Актуальная мета WR.",
    url: "/tierlist",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "ru_RU",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
