import { NextRequest, NextResponse } from "next/server";
import { getContentSecurityPolicy } from "./lib/security-headers.js";

export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const contentSecurityPolicy = getContentSecurityPolicy(nonce);

  if (request.nextUrl.pathname === "/api/") {
    const response = NextResponse.redirect(new URL("/api", request.url), 308);
    response.headers.set("Content-Security-Policy", contentSecurityPolicy);
    response.headers.set("Content-Type", "application/json; charset=utf-8");
    return response;
  }

  if (
    request.nextUrl.pathname === "/me/chat" &&
    !request.cookies.has("wr_user_session")
  ) {
    const response = NextResponse.redirect(new URL("/me", request.url));
    response.headers.set("Content-Security-Policy", contentSecurityPolicy);
    response.headers.set("Content-Type", "text/html; charset=utf-8");
    return response;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", contentSecurityPolicy);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.headers.set("Content-Security-Policy", contentSecurityPolicy);
  const isHtmlDocumentRequest =
    !request.nextUrl.pathname.startsWith("/api") &&
    request.headers.get("accept")?.includes("text/html");

  if (isHtmlDocumentRequest) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};