import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getUserRedirectUrl,
  getUserSessionTokenFromCookie,
} from "@/lib/site-user-auth.js";
import { updateSiteUserProfile } from "@/lib/site-user-api.js";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = getUserSessionTokenFromCookie(cookieStore);

  if (!sessionToken) {
    return NextResponse.redirect(getUserRedirectUrl(request, "/me?error=unauthorized"));
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
    await updateSiteUserProfile(
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
    return NextResponse.redirect(getUserRedirectUrl(request, "/me?updated=1"));
  } catch (error) {
    return NextResponse.redirect(
      getUserRedirectUrl(
        request,
        `/me?error=${encodeURIComponent(error instanceof Error ? error.message : "profile_update_failed")}`,
      ),
    );
  }
}
