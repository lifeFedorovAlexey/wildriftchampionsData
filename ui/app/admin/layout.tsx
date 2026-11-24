import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Админка Wild Rift",
  description: "Служебный раздел управления Wild Rift All Stats.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
