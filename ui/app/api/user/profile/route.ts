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

  try {
    await updateSiteUserProfile(
      sessionToken,
      {
        displayName,
        avatarUrl,
      },
      process.env,
    );
    return NextResponse.redirect(getUserRedirectUrl(request, "/me?updated=1"));
  } catch {
    return NextResponse.redirect(
      getUserRedirectUrl(request, "/me?error=profile_update_failed"),
    );
  }
}
