import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Гайды чемпионов WR",
  description: "Каталог импортированных гайдов по чемпионам Wild Rift.",
  alternates: { canonical: "/guides" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
