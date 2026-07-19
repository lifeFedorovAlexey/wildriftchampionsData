import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { fetchWrApiJson } from "@/lib/chat-api";
import { getUserSessionTokenFromCookie } from "@/lib/site-user-auth.js";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = getUserSessionTokenFromCookie(cookieStore);
  if (!sessionToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const payload = await fetchWrApiJson(
      "/api/user/chat/attachments",
      sessionToken,
      { method: "POST", body: JSON.stringify(body || {}) },
      process.env,
    );
    return NextResponse.json(payload, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "chat_attachment_create_failed" },
      { status: 400 },
    );
  }
}
