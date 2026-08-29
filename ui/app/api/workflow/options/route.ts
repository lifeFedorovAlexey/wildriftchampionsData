import { NextResponse } from "next/server";

import { fetchApiJson } from "@/lib/server-api";
import { buildWorkflowOptions } from "@/lib/workflow-options";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snapshot = await fetchApiJson("/api/latest-stats-snapshot");
    return NextResponse.json(buildWorkflowOptions(snapshot));
  } catch (error) {
    console.error("[ui] /api/workflow/options error:", error);
    const message = error instanceof Error ? error.message : "workflow_options_unavailable";
    const status = message.startsWith("workflow_options_") ? 409 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
