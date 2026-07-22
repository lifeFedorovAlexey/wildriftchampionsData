import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { buildApiUrl } from "@/lib/server-api.js";
import { getUserSessionTokenFromCookie } from "@/lib/site-user-auth.js";

export const dynamic = "force-dynamic";

const MAX_DESCRIPTOR_BYTES = 8 * 1024;

async function readDescriptor(request: NextRequest) {
  const reader = request.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_DESCRIPTOR_BYTES) {
      await reader.cancel();
      return "too_large" as const;
    }
    chunks.push(value);
  }
  try {
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionToken = getUserSessionTokenFromCookie(cookieStore);
  if (!sessionToken) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_DESCRIPTOR_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  const input = await readDescriptor(request);
  if (input === "too_large") {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }
  if (!input || typeof input !== "object") {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const descriptorResponse = await fetch(
    buildApiUrl("/api/quizzes/media-upload"),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contentType: input.contentType,
        size: input.size,
      }),
      cache: "no-store",
    },
  );
  const descriptor = await descriptorResponse.json().catch(() => null);
  if (
    !descriptorResponse.ok ||
    !descriptor?.uploadUrl ||
    !descriptor?.uploadFields ||
    !descriptor?.url
  ) {
    return NextResponse.json(
      { error: descriptor?.error || "quiz_media_storage_unavailable" },
      { status: descriptorResponse.status || 503 },
    );
  }

  return NextResponse.json({
    uploadUrl: descriptor.uploadUrl,
    uploadFields: descriptor.uploadFields,
    url: descriptor.url,
    maxBytes: descriptor.maxBytes,
  });
}
