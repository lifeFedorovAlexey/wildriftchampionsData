import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  buildAdminUrl,
  getAdminCookieOptions,
} from "@/lib/admin-auth.js";
import { revokeAdminSession } from "@/lib/admin-api.js";

export async function POST(request: NextRequest) {
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || "";
  await revokeAdminSession(sessionToken, process.env);
  const response = NextResponse.redirect(buildAdminUrl(request, "/admin/login"));
  response.cookies.set(ADMIN_SESSION_COOKIE, "", getAdminCookieOptions(request, 0));
  return response;
}
