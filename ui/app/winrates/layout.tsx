import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Винрейты WR по линиям и рангам",
  description:
    "Винрейты чемпионов Wild Rift (WR) по линиям и рангам. Мета мобильного LoL: кто выигрывает чаще всего.",
  keywords: [
    "винрейты WR",
    "винрейт Wild Rift",
    "WR winrate",
    "мобильный лол мета",
    "статистика Wild Rift",
    "WR чемпионы винрейт",
  ],
  alternates: { canonical: "/winrates" },
  openGraph: {
    title: "Винрейты WR по линиям и рангам",
    description:
      "Винрейты чемпионов Wild Rift по линиям и рангам. Актуальная мета WR.",
    url: "/winrates",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "ru_RU",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
