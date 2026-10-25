import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getUserSessionTokenFromCookie } from "@/lib/site-user-auth.js";
import { buildApiUrl } from "@/lib/server-api.js";

async function proxy(request: NextRequest) {
  const token = getUserSessionTokenFromCookie(await cookies());
  const noStore = { "Cache-Control": "no-store" };
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: noStore });
  // Same-origin cookie endpoint: prevent cross-site writes without a CSRF token.
  const origin = request.headers.get("origin");
  const publicOrigin = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin).origin;
  if (request.method !== "GET" && origin && origin !== publicOrigin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403, headers: noStore });
  }
  try {
    const query = new URLSearchParams();
    if (request.nextUrl.searchParams.has("channelId")) query.set("channelId", request.nextUrl.searchParams.get("channelId") || "");
    const response = await fetch(buildApiUrl(`/api/user/chat/lux?${query}`, process.env), {
      method: request.method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      cache: "no-store", signal: AbortSignal.timeout(15000),
    });
    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status, headers: noStore });
  } catch {
    return NextResponse.json({ error: "lux_unavailable" }, { status: 503, headers: noStore });
  }
}

export const GET = proxy;
export const DELETE = proxy;
