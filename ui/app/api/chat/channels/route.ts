import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchWrApiJson } from "@/lib/chat-api";
import { getUserSessionTokenFromCookie } from "@/lib/site-user-auth.js";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = getUserSessionTokenFromCookie(cookieStore);

  if (!sessionToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const groupId = request.nextUrl.searchParams.get("groupId");
  if (!groupId) {
    return NextResponse.json({ error: "chat_group_required" }, { status: 400 });
  }

  try {
    const payload = await fetchWrApiJson(
      `/api/user/chat/channels?groupId=${encodeURIComponent(groupId)}`,
      sessionToken,
      {},
      process.env,
    );
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "chat_channels_fetch_failed" },
      { status: 400 },
    );
  }
}
