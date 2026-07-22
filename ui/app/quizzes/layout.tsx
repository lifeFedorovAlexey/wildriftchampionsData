import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedSiteUser } from "@/lib/server-site-user";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function QuizzesLayout({ children }: { children: React.ReactNode }) {
  if (!(await getAuthenticatedSiteUser())) redirect("/me");
  return children;
}
