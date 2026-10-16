import { fetchApiJson } from "@/lib/server-api.js";
import type { PatchNoteSummary } from "@/app/patch-notes/patch-notes-lib";
import { PATCH_PAGE_SIZE } from "@/app/patch-notes/patch-notes-shared";

export async function GET(request: Request) {
  const after = new URL(request.url).searchParams.get("after") || "";
  if (!/^\d+\.\d+[a-z]?$/i.test(after)) {
    return Response.json({ error: "Invalid patch cursor" }, { status: 400 });
  }
  try {
    const payload = await fetchApiJson("/api/patch-notes", { fetchOptions: { cache: "no-store" } });
    if (!Array.isArray(payload?.items)) throw new Error("Invalid patch list");
    const items: PatchNoteSummary[] = payload.items;
    const index = items.findIndex((patch) => patch.version === after);
    if (index < 0) return Response.json({ error: "Patch not found" }, { status: 404 });
    const page = items.slice(index + 1, index + 1 + PATCH_PAGE_SIZE);
    return Response.json({
      items: page,
      nextCursor: index + 1 + page.length < items.length ? page.at(-1)!.version : null,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Unable to load patch notes" }, { status: 503 });
  }
}
