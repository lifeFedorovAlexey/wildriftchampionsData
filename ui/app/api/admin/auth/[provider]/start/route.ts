import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_STATE_COOKIE,
  ADMIN_STATE_TTL_SECONDS,
  buildAdminAuthorizeUrl,
  getAdminCookieOptions,
  getAdminOrigin,
  getAdminProvider,
  issueAdminState,
  sanitizeAdminReturnTo,
} from "@/lib/admin-auth.js";

function buildAdminUrl(request: NextRequest, path: string) {
  const origin = getAdminOrigin(request, process.env) || new URL(request.url).origin;
  return new URL(path, `${origin}/`);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await params;
  const provider = getAdminProvider(request, providerId, process.env);

  if (!provider || provider.type !== "oauth" || !provider.enabled) {
    return NextResponse.redirect(
      buildAdminUrl(request, "/admin/login?error=provider_not_available"),
    );
  }

  const returnTo = sanitizeAdminReturnTo(
    request.nextUrl.searchParams.get("returnTo"),
  );
  const stateToken = issueAdminState(provider.id, returnTo, process.env);

  if (!stateToken) {
    return NextResponse.redirect(
      buildAdminUrl(request, "/admin/login?error=session_secret_missing"),
    );
  }

  const authorizeUrl = buildAdminAuthorizeUrl(provider, stateToken);
  const response = NextResponse.redirect(authorizeUrl);
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");

  response.cookies.set(
    ADMIN_STATE_COOKIE,
    stateToken,
    getAdminCookieOptions(request, ADMIN_STATE_TTL_SECONDS),
  );

  return response;
}
