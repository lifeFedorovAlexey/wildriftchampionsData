import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  buildAdminUrl,
  getAdminCookieOptions,
  sanitizeAdminReturnTo,
} from "@/lib/admin-auth.js";
import { exchangeAdminTelegramWebAppSession } from "@/lib/admin-api.js";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  let initData = "";
  let returnTo = "/admin";

  try {
    const body = await request.json();
    initData = String(body?.initData || "").trim();
    returnTo = sanitizeAdminReturnTo(body?.returnTo || "/admin");
  } catch {
    return NextResponse.json(
      { ok: false, error: "telegram_missing_init_data" },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const currentSessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value || "";

  try {
    const result = await exchangeAdminTelegramWebAppSession(
      initData,
      process.env,
      currentSessionToken,
    );

    const response = NextResponse.json({
      ok: true,
      redirectTo: buildAdminUrl(request, returnTo).toString(),
    });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      result.sessionToken,
      getAdminCookieOptions(request, ADMIN_SESSION_TTL_SECONDS),
    );
    return response;
  } catch (error) {
    const code = error instanceof Error ? error.message : "telegram_bad_hash";
    return NextResponse.json(
      {
        ok: false,
        error: code,
        redirectTo: buildAdminUrl(
          request,
          `/admin/login?error=${encodeURIComponent(code)}`,
        ).toString(),
      },
      { status: 400 },
    );
  }
}
