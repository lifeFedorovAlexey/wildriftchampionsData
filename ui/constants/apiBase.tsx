const rawApiBase = process.env.NEXT_PUBLIC_API_BASE || "/wr-api";

export const API_BASE = rawApiBase.replace(/\/+$/, "") || "/wr-api";
export const INQ_TWITCH_URL = "https://www.twitch.tv/inq_wr";
