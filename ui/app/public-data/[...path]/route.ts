import { readPublicApi } from "@/lib/public-data-store.js";
import { proxyBackendApi } from "@/lib/backend-api-proxy.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path = [] } = await context.params;
    const pathname = `/${path.join("/")}`;
    const result = await readPublicApi(pathname, new URL(request.url).searchParams);

    if (!result) {
      return await proxyBackendApi(request, pathname);
    }

    return Response.json(result.payload, {
      status: result.status || 200,
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[public-data] snapshot read failed", error);
    try {
      const { path = [] } = await context.params;
      return await proxyBackendApi(request, `/${path.join("/")}`);
    } catch {
      return Response.json({ error: "Public snapshot is unavailable" }, { status: 503 });
    }
  }
}

