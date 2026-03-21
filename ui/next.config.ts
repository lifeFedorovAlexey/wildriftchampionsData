import type { NextConfig } from "next";

const apiProxyTarget =
  process.env.API_PROXY_TARGET ||
  process.env.STATS_API_ORIGIN ||
  "https://wr-api.vercel.app";

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },

  images: {
    formats: ["image/avif", "image/webp"],
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
