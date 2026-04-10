import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import PrivateProfilePage from "@/components/profile/PrivateProfilePage";
import { fetchAdminProfile, fetchAdminSession } from "@/lib/admin-api.js";
import {
  getAdminErrorMessage,
  getAdminProviderCards,
  getAdminProviders,
  getAdminSessionTokenFromCookie,
} from "@/lib/admin-auth.js";
import { fetchProfileChampionOptions } from "@/lib/profile-api.js";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const sessionToken = getAdminSessionTokenFromCookie(cookieStore);
  const session = await fetchAdminSession(sessionToken, process.env);

  if (!session) {
    redirect("/admin/login");
  }

  const profile = await fetchAdminProfile(sessionToken, process.env);
  if (!profile) {
    redirect("/admin/login?error=profile_update_failed");
  }

  const origin = `${requestHeaders.get("x-forwarded-proto") || "https"}://${requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || ""}`;
  const requestLike = { url: `${origin}/admin` };
  const providerCards = getAdminProviderCards(requestLike, process.env);
  const providers = getAdminProviders(requestLike, process.env);
  const errorValue = Array.isArray(params.error) ? params.error[0] : params.error;
  const errorText = getAdminErrorMessage(errorValue);
  const updated = (Array.isArray(params.updated) ? params.updated[0] : params.updated) === "1";
  const champions = await fetchProfileChampionOptions(process.env);
  const canManageAccess = Array.isArray(session.roles)
    ? session.roles.includes("owner")
    : false;

  return (
    <AdminShell activeSection="profile" canManageAccess={canManageAccess}>
      <PrivateProfilePage
        profile={profile}
        providerCards={providerCards}
        telegramProvider={providers.telegram || null}
        champions={champions}
        saveAction="/api/admin/profile"
        logoutAction="/api/admin/auth/logout"
        homeHref="/"
        title="Твой профиль"
        lead="Один и тот же профиль доступен и в user, и в admin-зоне."
        errorText={errorText}
        updated={updated}
        embedded
        showHomeLink={false}
        showLogoutButton={false}
      />
    </AdminShell>
  );
}
