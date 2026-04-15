import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserSessionTokenFromCookie } from "@/lib/site-user-auth.js";
import { exchangeChatSession } from "@/lib/chat-api";

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = getUserSessionTokenFromCookie(cookieStore);

  if (!sessionToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const payload = await exchangeChatSession(sessionToken, process.env);
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "chat_session_exchange_failed" },
      { status: 400 },
    );
  }
}
