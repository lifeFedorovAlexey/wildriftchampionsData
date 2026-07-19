import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchWrApiJson } from "@/lib/chat-api";
import { getUserSessionTokenFromCookie } from "@/lib/site-user-auth.js";

async function getSessionToken() {
  const cookieStore = await cookies();
  return getUserSessionTokenFromCookie(cookieStore);
}

export async function GET(request: NextRequest) {
  const sessionToken = await getSessionToken();
  if (!sessionToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const groupId = request.nextUrl.searchParams.get("groupId");
  if (!groupId) {
    return NextResponse.json({ error: "chat_group_required" }, { status: 400 });
  }

  try {
    const payload = await fetchWrApiJson(
      `/api/user/chat/moderation?groupId=${encodeURIComponent(groupId)}`,
      sessionToken,
      {},
      process.env,
    );
    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "chat_moderation_load_failed" },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest) {
  const sessionToken = await getSessionToken();
  if (!sessionToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const payload = await fetchWrApiJson(
      "/api/user/chat/moderation",
      sessionToken,
      { method: "POST", body: JSON.stringify(body || {}) },
      process.env,
    );
    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "chat_moderation_failed" },
      { status: 400 },
    );
  }
}
