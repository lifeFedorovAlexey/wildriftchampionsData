import { NextResponse } from "next/server";
import { getAuthenticatedSiteUser } from "@/lib/server-site-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthenticatedSiteUser();
  return NextResponse.json(
    { authenticated: Boolean(user) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
