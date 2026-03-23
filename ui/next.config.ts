import type { NextConfig } from "next";
import { getStatsApiBaseUrl } from "./lib/stats-api-origin.js";

const apiProxyTarget = getStatsApiBaseUrl(process.env);

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
