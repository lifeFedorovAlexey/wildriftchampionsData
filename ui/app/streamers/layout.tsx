import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Тирлисты стримеров Wild Rift",
  description:
    "Публичные тирлисты стримеров Wild Rift: оценки чемпионов по линиям, рангам и актуальной статистике.",
  alternates: { canonical: "/streamers" },
  openGraph: {
    title: "Тирлисты стримеров Wild Rift",
    description: "Публичные оценки чемпионов Wild Rift от стримеров и авторов меты.",
    url: "/streamers",
    type: "website",
    locale: "ru_RU",
  },
};

export default function StreamersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
