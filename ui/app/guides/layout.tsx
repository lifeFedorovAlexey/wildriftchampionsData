import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Гайды чемпионов WR",
  description:
    "Локальная витрина импортированных гайдов по чемпионам Wild Rift.",
  alternates: { canonical: "/guides/braum" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
