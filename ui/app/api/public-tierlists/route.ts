import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { buildApiUrl } from "@/lib/server-api.js";
import { getUserSessionTokenFromCookie } from "@/lib/site-user-auth.js";

async function proxy(request: NextRequest, init: RequestInit = {}) {
  const cookieStore = await cookies();
  const sessionToken = getUserSessionTokenFromCookie(cookieStore);
  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");
  if (sessionToken) headers.set("Authorization", `Bearer ${sessionToken}`);
  const editToken = request.headers.get("x-tierlist-edit-token");
  if (editToken) headers.set("x-tierlist-edit-token", editToken);
  if (init.body) headers.set("Content-Type", "application/json");

  const upstream = await fetch(
    buildApiUrl(`/api/public-tierlists${request.nextUrl.search}`, process.env),
    { ...init, headers, cache: "no-store" },
  );
  const payload = await upstream.json().catch(() => null);
  return { upstream, payload };
}

export async function GET(request: NextRequest) {
  const { upstream, payload } = await proxy(request);
  return NextResponse.json(payload, {
    status: upstream.status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { upstream, payload } = await proxy(request, {
    method: "POST",
    body: JSON.stringify(body || {}),
  });

  if (upstream.ok) {
    revalidatePath("/streamers");
    if (payload?.publication?.publicId) {
      revalidatePath(`/tierlists/${payload.publication.publicId}`);
    }
  }

  return NextResponse.json(payload, {
    status: upstream.status,
    headers: { "Cache-Control": "no-store" },
  });
}
