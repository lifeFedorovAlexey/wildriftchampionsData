import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "@/lib/server-api.js";
import { getUserSessionTokenFromCookie } from "@/lib/site-user-auth.js";

export async function proxyQuizApi(request: NextRequest, pathname: string) {
  const sessionToken = getUserSessionTokenFromCookie(await cookies());
  if (!sessionToken) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const target = new URL(buildApiUrl(pathname, process.env));
  request.nextUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value));
  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.text();
  const response = await fetch(target, {
    method: request.method,
    body: body || undefined,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${sessionToken}`,
      ...(body ? { "Content-Type": request.headers.get("content-type") || "application/json" } : {}),
    },
    cache: "no-store",
  });
  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") || "application/json", "Cache-Control": "no-store" },
  });
}
