import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Профиль Wild Rift",
  description: "Профиль и персональные разделы Wild Rift All Stats.",
  robots: { index: false, follow: false },
};

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
