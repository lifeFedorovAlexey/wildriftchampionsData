import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getStatsApiBaseUrl } from "./lib/stats-api-origin.js";

const apiProxyTarget = getStatsApiBaseUrl(process.env);
const configDir = path.dirname(fileURLToPath(import.meta.url));
const storageBaseUrl = process.env.S3_PUBLIC_BASE_URL || "";
const storageUrl = storageBaseUrl ? new URL(storageBaseUrl) : null;
const storageRemotePatterns = [
  {
    protocol: "https" as const,
    hostname: "s3.twcstorage.ru",
    pathname: "/**",
  },
];

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  turbopack: {
    root: configDir,
  },

  images: {
    formats: ["image/avif", "image/webp"],
    localPatterns: [
      {
        pathname: "/boosty-donate-qr.png",
      },
      {
        pathname: "/boosty-logo.svg",
      },
      {
        pathname: "/favicon.ico",
      },
      {
        pathname: "/provider-icons/**",
      },
      {
        pathname: "/wr-api/icons/**",
      },
      {
        pathname: "/wr-api/assets/**",
      },
    ],
    remotePatterns: storageUrl
      ? [
          ...storageRemotePatterns,
          {
            protocol: storageUrl.protocol.replace(":", "") as "http" | "https",
            hostname: storageUrl.hostname,
            pathname: `${storageUrl.pathname.replace(/\/$/, "") || ""}/**`,
          },
        ]
      : storageRemotePatterns,
  },

  async rewrites() {
    return [
      {
        source: "/wr-api/:path*",
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
