import { NextRequest } from "next/server";
import { proxyQuizApi } from "@/lib/quiz-api-proxy";

export const dynamic = "force-dynamic";
export function GET(request: NextRequest) { return proxyQuizApi(request, "/api/users/me/quiz-attempts"); }
