import { NextRequest, NextResponse } from "next/server";
import {
  buildAdminUrl,
  getAdminSessionTokenFromCookie,
} from "@/lib/admin-auth.js";
import { cookies } from "next/headers";
import { updateAdminProfile } from "@/lib/admin-api.js";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = getAdminSessionTokenFromCookie(cookieStore);

  if (!sessionToken) {
    return NextResponse.redirect(buildAdminUrl(request, "/admin/login?error=unauthorized"));
  }

  const formData = await request.formData();
  const displayName = String(formData.get("displayName") || "");
  const avatarUrl = String(formData.get("avatarUrl") || "");
  const wildRiftHandle = String(formData.get("wildRiftHandle") || "");
  const peakRank = String(formData.get("peakRank") || "");
  const mainChampionSlugs = formData
    .getAll("mainChampionSlugs")
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  try {
    await updateAdminProfile(
      sessionToken,
      {
        displayName,
        avatarUrl,
        wildRiftHandle,
        peakRank,
        mainChampionSlugs,
      },
      process.env,
    );
    return NextResponse.redirect(buildAdminUrl(request, "/admin?updated=1"));
  } catch (error) {
    return NextResponse.redirect(
      buildAdminUrl(
        request,
        `/admin?error=${encodeURIComponent(error instanceof Error ? error.message : "profile_update_failed")}`,
      ),
    );
  }
}
