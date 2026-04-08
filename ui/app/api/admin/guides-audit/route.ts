import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  fetchAdminGuidesAudit,
  startAdminGuidesAudit,
} from "@/lib/admin-api.js";
import { getAdminSessionTokenFromCookie } from "@/lib/admin-auth.js";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = getAdminSessionTokenFromCookie(cookieStore);

  if (!sessionToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const runId = request.nextUrl.searchParams.get("runId") || "";
  const payload = await fetchAdminGuidesAudit(sessionToken, process.env, runId);

  if (!payload) {
    return NextResponse.json({ error: "guides_audit_unavailable" }, { status: 502 });
  }

  return NextResponse.json(payload);
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = getAdminSessionTokenFromCookie(cookieStore);

  if (!sessionToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const payload = await startAdminGuidesAudit(sessionToken, body, process.env);
    return NextResponse.json(payload, { status: 202 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "guides_audit_start_failed";
    const status = code === "audit_already_running" ? 409 : code === "slug_required" ? 400 : 502;
    return NextResponse.json({ error: code }, { status });
  }
}
