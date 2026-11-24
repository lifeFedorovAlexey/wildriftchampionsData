import { readPublicApi } from "@/lib/public-data-store.js";
import { buildApiUrl } from "@/lib/server-api.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function proxyToApi(request: Request, pathname: string) {
  const target = `${buildApiUrl(pathname, { ...process.env, PUBLIC_DATA_MODE: "" })}${new URL(request.url).search}`;
  const method = request.method.toUpperCase();
  const response = await fetch(target, {
    method,
    headers: request.headers,
    body: method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer(),
    cache: "no-store",
  });

  return new Response(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path = [] } = await context.params;
    const pathname = `/${path.join("/")}`;
    const result = await readPublicApi(pathname, new URL(request.url).searchParams);

    if (!result) {
      return await proxyToApi(request, pathname);
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
      return await proxyToApi(request, `/${path.join("/")}`);
    } catch {
      return Response.json({ error: "Public snapshot is unavailable" }, { status: 503 });
    }
  }
}

