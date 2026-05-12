import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getUserRedirectUrl,
  getUserSessionTokenFromCookie,
} from "@/lib/site-user-auth.js";
import { uploadSiteUserAvatar } from "@/lib/site-user-api.js";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = getUserSessionTokenFromCookie(cookieStore);

  if (!sessionToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const imageBase64 = String(body?.imageBase64 || "");
    const payload = await uploadSiteUserAvatar(sessionToken, imageBase64, process.env);

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "avatar_upload_failed";
    const status =
      code === "unauthorized"
        ? 401
        : code === "avatar_storage_unavailable"
          ? 503
          : 400;

    return NextResponse.json(
      { error: code, redirect: getUserRedirectUrl(request, "/me?error=unauthorized") },
      { status },
    );
  }
}
