import { NextRequest, NextResponse } from "next/server";
import {
  USER_SESSION_COOKIE,
  USER_SESSION_TTL_SECONDS,
  USER_STATE_COOKIE,
  buildUserLoginRedirect,
  exchangeUserOAuthCode,
  fetchOAuthProfile,
  getUserCookieOptions,
  getUserProvider,
  getUserRedirectUrl,
  getUserSessionTokenFromCookie,
  mapOAuthProfile,
  readUserState,
  sanitizeUserReturnTo,
  verifyTelegramLogin,
} from "@/lib/site-user-auth.js";
import { cookies } from "next/headers";
import { exchangeSiteUserSession } from "@/lib/site-user-api.js";

function redirectToMe(request: NextRequest, code: string) {
  const response = NextResponse.redirect(
    getUserRedirectUrl(request, buildUserLoginRedirect(code)),
  );
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  return response;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await params;
  const provider = getUserProvider(request, providerId, process.env);

  if (!provider || !provider.enabled) {
    return redirectToMe(request, "provider_not_available");
  }

  const cookieStore = await cookies();
  const currentSessionToken = getUserSessionTokenFromCookie(cookieStore);

  if (provider.type === "telegram") {
    const verified = await verifyTelegramLogin(request.nextUrl.searchParams, process.env);

    if (!verified.ok || !verified.profile) {
      return redirectToMe(request, verified.reason || "telegram_bad_hash");
    }

    try {
      const result = await exchangeSiteUserSession(
        verified.profile,
        process.env,
        currentSessionToken,
      );
      const response = NextResponse.redirect(getUserRedirectUrl(request, "/me"));
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      response.headers.set("Pragma", "no-cache");
      response.cookies.set(
        USER_SESSION_COOKIE,
        result.sessionToken,
        getUserCookieOptions(request, USER_SESSION_TTL_SECONDS),
      );
      return response;
    } catch (error) {
      return redirectToMe(request, error instanceof Error ? error.message : "user_auth_failed");
    }
  }

  const stateToken = request.cookies.get(USER_STATE_COOKIE)?.value || "";
  const expectedState = await readUserState(stateToken, process.env);
  const returnedState = String(request.nextUrl.searchParams.get("state") || "");

  if (!expectedState || returnedState !== expectedState.nonce || expectedState.provider !== providerId) {
    return redirectToMe(request, "oauth_state_invalid");
  }

  if (request.nextUrl.searchParams.get("error")) {
    return redirectToMe(request, "oauth_access_denied");
  }

  const code = String(request.nextUrl.searchParams.get("code") || "");
  if (!code) {
    return redirectToMe(request, "oauth_access_denied");
  }

  try {
    const tokenPayload = await exchangeUserOAuthCode(provider, code, stateToken, {
      deviceId: request.nextUrl.searchParams.get("device_id") || "",
    });
    const accessToken = String(tokenPayload.access_token || "");
    const profilePayload = await fetchOAuthProfile(provider, accessToken, tokenPayload);
    const profile = mapOAuthProfile(providerId, profilePayload, tokenPayload);

    if (!profile) {
      return redirectToMe(request, "user_auth_failed");
    }

    const result = await exchangeSiteUserSession(
      profile,
      process.env,
      currentSessionToken,
    );

    const response = NextResponse.redirect(
      getUserRedirectUrl(request, sanitizeUserReturnTo(expectedState.returnTo)),
    );
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.cookies.set(
      USER_SESSION_COOKIE,
      result.sessionToken,
      getUserCookieOptions(request, USER_SESSION_TTL_SECONDS),
    );
    response.cookies.set(USER_STATE_COOKIE, "", getUserCookieOptions(request, 0));
    return response;
  } catch (error) {
    return redirectToMe(request, error instanceof Error ? error.message : "oauth_access_denied");
  }
}
