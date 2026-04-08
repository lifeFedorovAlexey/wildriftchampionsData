import { NextRequest, NextResponse } from "next/server";
import {
  USER_SESSION_COOKIE,
  getUserCookieOptions,
  getUserRedirectUrl,
} from "@/lib/site-user-auth.js";
import { cookies } from "next/headers";
import { revokeSiteUserSession } from "@/lib/site-user-api.js";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(USER_SESSION_COOKIE)?.value || "";

  await revokeSiteUserSession(sessionToken, process.env);

  const response = NextResponse.redirect(getUserRedirectUrl(request, "/me"));
  response.cookies.set(USER_SESSION_COOKIE, "", getUserCookieOptions(request, 0));
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  return response;
}
