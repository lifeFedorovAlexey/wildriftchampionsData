import { NextRequest, NextResponse } from "next/server";
import {
  USER_STATE_COOKIE,
  getUserCookieOptions,
  getUserProvider,
  getUserAuthorizeUrl,
  getUserRedirectUrl,
  issueUserState,
  sanitizeUserReturnTo,
} from "@/lib/site-user-auth.js";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider: providerId } = await params;
    const provider = getUserProvider(request, providerId, process.env);

    if (!provider || !provider.enabled) {
      return NextResponse.redirect(
        getUserRedirectUrl(request, "/me?error=provider_not_available"),
      );
    }

    const returnTo = sanitizeUserReturnTo(
      request.nextUrl.searchParams.get("returnTo"),
    );
    const stateToken = await issueUserState(provider.id, returnTo, process.env);

    if (!stateToken) {
      return NextResponse.redirect(
        getUserRedirectUrl(request, "/me?error=session_secret_missing"),
      );
    }

    const authorizeUrl = await getUserAuthorizeUrl(provider, stateToken);
    if (!authorizeUrl) {
      return NextResponse.redirect(
        getUserRedirectUrl(request, "/me?error=oauth_start_failed"),
      );
    }

    const response = NextResponse.redirect(authorizeUrl);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");

    response.cookies.set(
      USER_STATE_COOKIE,
      stateToken,
      getUserCookieOptions(request, 60 * 10),
    );

    return response;
  } catch (error) {
    console.error("site user oauth start failed", error);
    return NextResponse.redirect(
      getUserRedirectUrl(request, "/me?error=oauth_start_failed"),
    );
  }
}
