import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Гайды по чемпионам WR",
  description:
    "Каталог гайдов по чемпионам Wild Rift: сборки предметов, руны, порядок прокачки, контрпики и синергии.",
  keywords: [
    "гайды Wild Rift",
    "гайды WR",
    "сборки Wild Rift",
    "руны Wild Rift",
    "контрпики Wild Rift",
    "чемпионы Wild Rift гайды",
  ],
  alternates: { canonical: "/guides" },
  openGraph: {
    title: "Гайды по чемпионам WR",
    description:
      "Каталог гайдов по чемпионам Wild Rift: сборки, руны, прокачка и матчапы.",
    url: "/guides",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
    title: "Гайды по чемпионам WR",
    description:
      "Каталог гайдов по чемпионам Wild Rift: сборки, руны, прокачка и матчапы.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
