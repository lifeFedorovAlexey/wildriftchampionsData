import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  ADMIN_STATE_COOKIE,
  buildAdminUrl,
  getAdminCookieOptions,
  getAdminProvider,
  exchangeOAuthCode,
  fetchOAuthProfile,
  mapOAuthProfile,
  readAdminState,
  sanitizeAdminReturnTo,
  verifyTelegramLogin,
} from "@/lib/admin-auth.js";
import { exchangeAdminSession } from "@/lib/admin-api.js";

function redirectToLogin(request: NextRequest, code: string) {
  const response = NextResponse.redirect(
    buildAdminUrl(
      request,
      `/admin/login?error=${encodeURIComponent(code)}`,
    ),
  );
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.cookies.set(
    ADMIN_STATE_COOKIE,
    "",
    getAdminCookieOptions(request, 0),
  );
  return response;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await params;
  const provider = getAdminProvider(request, providerId, process.env);

  if (!provider || !provider.enabled) {
    return redirectToLogin(request, "provider_not_available");
  }

  if (provider.type === "telegram") {
    const verified = await verifyTelegramLogin(request.nextUrl.searchParams, process.env);
    const currentSessionToken =
      request.cookies.get(ADMIN_SESSION_COOKIE)?.value || "";

    if (!verified.ok || !verified.profile) {
      return redirectToLogin(request, verified.reason || "telegram_bad_hash");
    }

    try {
      const result = await exchangeAdminSession(
        verified.profile,
        process.env,
        currentSessionToken,
      );
      const response = NextResponse.redirect(buildAdminUrl(request, "/admin"));
      response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      response.headers.set("Pragma", "no-cache");
      response.cookies.set(
        ADMIN_SESSION_COOKIE,
        result.sessionToken,
        getAdminCookieOptions(request, ADMIN_SESSION_TTL_SECONDS),
      );

      return response;
    } catch (error) {
      return redirectToLogin(request, error instanceof Error ? error.message : "admin_not_allowed");
    }
  }

  const stateToken = request.cookies.get(ADMIN_STATE_COOKIE)?.value || "";
  const currentSessionToken =
    request.cookies.get(ADMIN_SESSION_COOKIE)?.value || "";
  const expectedState = await readAdminState(stateToken, process.env);
  const returnedState = String(request.nextUrl.searchParams.get("state") || "");

  if (!expectedState || returnedState !== expectedState.nonce || expectedState.provider !== providerId) {
    return redirectToLogin(request, "oauth_state_invalid");
  }

  if (request.nextUrl.searchParams.get("error")) {
    return redirectToLogin(request, "oauth_access_denied");
  }

  const code = String(request.nextUrl.searchParams.get("code") || "");
  if (!code) {
    return redirectToLogin(request, "oauth_access_denied");
  }

  try {
    const tokenPayload = await exchangeOAuthCode(provider, code, stateToken, {
      deviceId: request.nextUrl.searchParams.get("device_id") || "",
    });
    const accessToken = String(tokenPayload.access_token || "");
    const profilePayload = await fetchOAuthProfile(provider, accessToken, tokenPayload);
    const profile = mapOAuthProfile(providerId, profilePayload, tokenPayload);

    if (!profile) {
      return redirectToLogin(request, "admin_not_allowed");
    }

    const result = await exchangeAdminSession(
      profile,
      process.env,
      currentSessionToken,
    );

    const response = NextResponse.redirect(
      buildAdminUrl(request, sanitizeAdminReturnTo(expectedState.returnTo)),
    );
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");

    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      result.sessionToken,
      getAdminCookieOptions(request, ADMIN_SESSION_TTL_SECONDS),
    );
    response.cookies.set(
      ADMIN_STATE_COOKIE,
      "",
      getAdminCookieOptions(request, 0),
    );

    return response;
  } catch (error) {
    return redirectToLogin(request, error instanceof Error ? error.message : "oauth_access_denied");
  }
}
