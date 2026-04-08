import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminGuidesAuditClient from "@/components/admin/AdminGuidesAuditClient";
import AdminShell from "@/components/admin/AdminShell";
import { fetchAdminGuidesAudit, fetchAdminSession } from "@/lib/admin-api.js";
import { getAdminSessionTokenFromCookie } from "@/lib/admin-auth.js";
import { fetchProfileChampionOptions } from "@/lib/profile-api.js";

export default async function AdminImportsPage() {
  const cookieStore = await cookies();
  const sessionToken = getAdminSessionTokenFromCookie(cookieStore);
  const session = await fetchAdminSession(sessionToken, process.env);

  if (!session) {
    redirect("/admin/login");
  }

  const [auditPayload, champions] = await Promise.all([
    fetchAdminGuidesAudit(sessionToken, process.env),
    fetchProfileChampionOptions(process.env),
  ]);

  return (
    <AdminShell activeSection="imports">
      <AdminGuidesAuditClient
        champions={champions}
        initialPayload={auditPayload}
      />
    </AdminShell>
  );
}
