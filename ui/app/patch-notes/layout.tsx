import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Патчноуты Wild Rift",
  description: "Официальные патчноуты Wild Rift на русском языке и оригиналы на английском.",
  alternates: { canonical: "/patch-notes" },
  openGraph: {
    title: "Патчноуты Wild Rift",
    description: "Официальные изменения баланса, чемпионов и предметов в Wild Rift.",
    url: "/patch-notes",
    type: "website",
    locale: "ru_RU",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
