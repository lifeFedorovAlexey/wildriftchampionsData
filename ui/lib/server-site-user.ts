import "server-only";

import { cookies } from "next/headers";
import { fetchSiteUserSession } from "@/lib/site-user-api.js";
import { getUserSessionTokenFromCookie } from "@/lib/site-user-auth.js";

export async function getAuthenticatedSiteUser() {
  const sessionToken = getUserSessionTokenFromCookie(await cookies());
  if (!sessionToken) return null;
  return await fetchSiteUserSession(sessionToken, process.env).catch(() => null);
}
