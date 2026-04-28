import type { Metadata } from "next";
import SupportPageClient from "./SupportPageClient";

export const metadata: Metadata = {
  title: "Поддержать",
  description:
    "Способы поддержать wildriftallstats.ru: карта, Boosty, партнёрская ссылка Яндекса и блок поддержки стримера INQ.",
  alternates: {
    canonical: "/support",
  },
  openGraph: {
    title: "Поддержать wildriftallstats.ru",
    description:
      "Страница поддержки проекта wildriftallstats.ru и отдельный блок автора тир-листа INQ.",
    url: "/support",
  },
};

export default function SupportPage() {
  return <SupportPageClient />;
}
