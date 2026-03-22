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
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "game.gtimg.cn",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "cmsassets.rgpub.io",
        pathname: "/sanity/images/**", // ✅ для изображений скинов WR
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
