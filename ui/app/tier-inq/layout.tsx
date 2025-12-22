import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Тир-лист WR — подбор по запросу",
  description:
    "Подбор тир-листа Wild Rift (WR) по условиям: линия, ранг и текущая мета. Быстрый поиск топ-чемпионов.",
  keywords: [
    "tier inq WR",
    "подбор тирлиста WR",
    "wr тирлист поиск",
    "топ чемпионы WR",
    "INQ тирлист Wild Rift",
  ],
  alternates: { canonical: "/tier-inq" },
  openGraph: {
    title: "Тир-лист WR — подбор по запросу",
    description: "Подбор тир-листа Wild Rift по линии и рангу. Найди топ WR.",
    url: "/tier-inq",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "ru_RU",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
