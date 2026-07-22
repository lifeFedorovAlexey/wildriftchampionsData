import { NextRequest } from "next/server";
import { proxyQuizApi } from "@/lib/quiz-api-proxy";

export const dynamic = "force-dynamic";
type Context = { params: Promise<{ segments: string[] }> };
async function run(request: NextRequest, context: Context) {
  const { segments } = await context.params;
  return proxyQuizApi(request, `/api/quizzes/${segments.map(encodeURIComponent).join("/")}`);
}
export const GET = run;
export const POST = run;
export const PATCH = run;
export const DELETE = run;
