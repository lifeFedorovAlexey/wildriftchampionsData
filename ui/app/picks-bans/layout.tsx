import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Топ пики и баны WR",
  description:
    "Топ пики и баны Wild Rift (WR): что чаще берут и банят по линиям и рангам. Мета мобильного LoL.",
  keywords: [
    "топ пики WR",
    "пики и баны WR",
    "WR picks bans",
    "что банить WR",
    "мета Wild Rift",
    "мобильный лол",
  ],
  alternates: { canonical: "/picks-bans" },
  openGraph: {
    title: "Топ пики и баны WR",
    description:
      "Пики и баны Wild Rift по линиям и рангам. Актуальная мета WR.",
    url: "/picks-bans",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "ru_RU",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
