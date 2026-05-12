import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { buildApiUrl } from "@/lib/server-api.js";
import { getUserSessionTokenFromCookie } from "@/lib/site-user-auth.js";

async function fetchStreamerTierlistsAuth(
  pathname: string,
  sessionToken: string,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers || {});
  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${sessionToken}`);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildApiUrl(pathname, process.env), {
    ...init,
    headers,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || `streamer_tierlist_http_${response.status}`);
  }

  return payload;
}

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = getUserSessionTokenFromCookie(cookieStore);

  if (!sessionToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const payload = await fetchStreamerTierlistsAuth("/api/user/streamer-tierlists", sessionToken);
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "streamer_tierlist_editor_failed" },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = getUserSessionTokenFromCookie(cookieStore);

  if (!sessionToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const payload = await fetchStreamerTierlistsAuth(
      "/api/user/streamer-tierlists",
      sessionToken,
      {
        method: "POST",
        body: JSON.stringify(body || {}),
      },
    );

    const streamerId = Number(payload?.streamer?.id || 0);
    revalidatePath("/streamers");
    if (streamerId > 0) {
      revalidatePath(`/streamers/${streamerId}`);
    }

    return NextResponse.json(payload, {
      status: 201,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "streamer_tierlist_publish_failed" },
      { status: 400 },
    );
  }
}
