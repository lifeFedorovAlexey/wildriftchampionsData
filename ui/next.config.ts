import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "game.gtimg.cn",
        pathname: "/images/**",
      },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/wr-api/:path*",
        destination: "https://wr-api.vercel.app/:path*",
      },
    ];
  },
};

export default nextConfig;
