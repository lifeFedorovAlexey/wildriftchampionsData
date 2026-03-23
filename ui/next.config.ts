import type { NextConfig } from "next";
import { getStatsApiBaseUrl } from "./lib/stats-api-origin.js";

const apiProxyTarget = getStatsApiBaseUrl(process.env);
const storageBaseUrl = process.env.S3_PUBLIC_BASE_URL || "";
const storageUrl = storageBaseUrl ? new URL(storageBaseUrl) : null;

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },

  images: {
    formats: ["image/avif", "image/webp"],
    localPatterns: [
      {
        pathname: "/wr-api/icons/**",
      },
      {
        pathname: "/wr-api/assets/**",
      },
    ],
    remotePatterns: storageUrl
      ? [
          {
            protocol: storageUrl.protocol.replace(":", "") as "http" | "https",
            hostname: storageUrl.hostname,
            pathname: `${storageUrl.pathname.replace(/\/$/, "") || ""}/**`,
          },
        ]
      : [],
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
