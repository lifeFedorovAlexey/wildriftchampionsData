import { getBackendApiBaseUrl } from "./stats-api-origin.js";

function forwardingHeaders(input, response = false) {
  const headers = new Headers(input);
  const connectionTokens = (headers.get("connection") || "").split(",").map(value => value.trim()).filter(Boolean);
  for (const name of [...connectionTokens, "connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade", "host", "content-length", "accept-encoding"]) {
    headers.delete(name);
  }
  // fetch returns a decompressed body; forwarding the old encoding corrupts it.
  if (response) headers.delete("content-encoding");
  return headers;
}

export async function proxyBackendApi(request, pathname, env = process.env) {
  const target = `${getBackendApiBaseUrl(env)}${pathname}${new URL(request.url).search}`;
  const method = request.method.toUpperCase();
  const response = await fetch(target, {
    method,
    headers: forwardingHeaders(request.headers),
    body: method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer(),
    cache: "no-store",
  });
  return new Response(response.body, {
    status: response.status,
    headers: forwardingHeaders(response.headers, true),
  });
}
