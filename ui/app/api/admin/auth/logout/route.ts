import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  getAdminCookieOptions,
  getAdminOrigin,
} from "@/lib/admin-auth.js";
import { revokeAdminSession } from "@/lib/admin-api.js";

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || "";
  await revokeAdminSession(sessionToken, process.env);
  const origin = getAdminOrigin(request, process.env) || new URL(request.url).origin;
  const response = NextResponse.redirect(new URL("/admin/login", `${origin}/`));
  response.cookies.set(ADMIN_SESSION_COOKIE, "", getAdminCookieOptions(request, 0));
  return response;
}
