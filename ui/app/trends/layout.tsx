import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Тренды WR — как меняется мета",
  description:
    "Тренды Wild Rift (WR): как меняются винрейты, пики и баны. Отслеживай мету мобильного LoL по времени.",
  keywords: [
    "тренды WR",
    "мета WR",
    "Wild Rift trends",
    "изменения меты Wild Rift",
    "мобильный лол мета",
  ],
  alternates: { canonical: "/trends" },
  openGraph: {
    title: "Тренды WR — как меняется мета",
    description: "Тренды Wild Rift: винрейты, пики и баны в динамике.",
    url: "/trends",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "ru_RU",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
