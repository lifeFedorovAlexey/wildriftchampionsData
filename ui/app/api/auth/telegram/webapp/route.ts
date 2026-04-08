import { NextRequest, NextResponse } from "next/server";
import {
  USER_SESSION_COOKIE,
  USER_SESSION_TTL_SECONDS,
  buildUserLoginRedirect,
  getUserCookieOptions,
  getUserRedirectUrl,
  sanitizeUserReturnTo,
} from "@/lib/site-user-auth.js";
import { exchangeSiteUserTelegramWebAppSession } from "@/lib/site-user-api.js";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  let initData = "";
  let returnTo = "/me";

  try {
    const body = await request.json();
    initData = String(body?.initData || "").trim();
    returnTo = sanitizeUserReturnTo(body?.returnTo || "/me");
  } catch {
    return NextResponse.json(
      { ok: false, error: "telegram_missing_init_data" },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const currentSessionToken = cookieStore.get(USER_SESSION_COOKIE)?.value || "";

  try {
    const result = await exchangeSiteUserTelegramWebAppSession(
      initData,
      process.env,
      currentSessionToken,
    );

    const response = NextResponse.json({
      ok: true,
      redirectTo: getUserRedirectUrl(request, returnTo).toString(),
    });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.cookies.set(
      USER_SESSION_COOKIE,
      result.sessionToken,
      getUserCookieOptions(request, USER_SESSION_TTL_SECONDS),
    );
    return response;
  } catch (error) {
    const code = error instanceof Error ? error.message : "telegram_bad_hash";
    return NextResponse.json(
      {
        ok: false,
        error: code,
        redirectTo: getUserRedirectUrl(request, buildUserLoginRedirect(code)).toString(),
      },
      { status: 400 },
    );
  }
}
