import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  buildAdminUrl,
  getAdminSessionTokenFromCookie,
} from "@/lib/admin-auth.js";
import { updateAdminAccessRoles } from "@/lib/admin-api.js";

function buildReturnPath(formData: FormData, extra: Record<string, string> = {}) {
  const params = new URLSearchParams();
  const query = String(formData.get("q") || "").trim();
  const selectedUserId = String(formData.get("selectedUserId") || "").trim();

  if (query) params.set("q", query);
  if (selectedUserId) params.set("user", selectedUserId);

  for (const [key, value] of Object.entries(extra)) {
    if (value) params.set(key, value);
  }

  const queryString = params.toString();
  return `/admin/access${queryString ? `?${queryString}` : ""}`;
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = getAdminSessionTokenFromCookie(cookieStore);

  if (!sessionToken) {
    return NextResponse.redirect(buildAdminUrl(request, "/admin/login?error=unauthorized"));
  }

  const formData = await request.formData();
  const siteUserId = String(formData.get("siteUserId") || "").trim();
  const roleKeys = formData
    .getAll("roleKeys")
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  try {
    await updateAdminAccessRoles(sessionToken, siteUserId, roleKeys, process.env);
    return NextResponse.redirect(
      buildAdminUrl(request, buildReturnPath(formData, { updated: "1" })),
    );
  } catch (error) {
    return NextResponse.redirect(
      buildAdminUrl(
        request,
        buildReturnPath(formData, {
          error: error instanceof Error ? error.message : "access_update_failed",
        }),
      ),
    );
  }
}
