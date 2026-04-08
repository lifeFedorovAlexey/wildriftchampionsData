import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  clearAdminGuidesAudit,
  fetchAdminGuidesAudit,
  startAdminGuidesAudit,
} from "@/lib/admin-api.js";
import { getAdminSessionTokenFromCookie } from "@/lib/admin-auth.js";

function resolvePublicAuditOrigins(request: NextRequest) {
  const requestOrigin = request.nextUrl.origin.replace(/\/+$/, "");
  const uiOrigin = String(
    process.env.GUIDES_AUDIT_UI_ORIGIN ||
    process.env.ADMIN_PUBLIC_ORIGIN ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    requestOrigin,
  ).replace(/\/+$/, "");
  const apiOrigin = String(
    process.env.GUIDES_AUDIT_API_ORIGIN ||
    process.env.API_PUBLIC_ORIGIN ||
    `${uiOrigin}/wr-api`,
  ).replace(/\/+$/, "");

  return { uiOrigin, apiOrigin };
}

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
    const payload = await startAdminGuidesAudit(
      sessionToken,
      {
        ...body,
        ...resolvePublicAuditOrigins(request),
      },
      process.env,
    );
    return NextResponse.json(payload, { status: 202 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "guides_audit_start_failed";
    const status = code === "audit_already_running" ? 409 : code === "slug_required" ? 400 : 502;
    return NextResponse.json({ error: code }, { status });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  const sessionToken = getAdminSessionTokenFromCookie(cookieStore);

  if (!sessionToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const payload = await clearAdminGuidesAudit(sessionToken, process.env);
    return NextResponse.json(payload);
  } catch (error) {
    const code = error instanceof Error ? error.message : "guides_audit_clear_failed";
    const status = code === "audit_already_running" ? 409 : 502;
    return NextResponse.json({ error: code }, { status });
  }
}
