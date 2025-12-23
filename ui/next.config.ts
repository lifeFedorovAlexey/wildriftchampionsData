import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 дней
    remotePatterns: [
      {
        protocol: "https",
        hostname: "game.gtimg.cn",
        pathname: "/images/lol/act/img/**",
      },
    ],
  },

  async rewrites() {
    return [
      {
        // всё что начинается с /wr-api/... прокинем на твой внешний API
        source: "/wr-api/:path*",
        destination: "https://wr-api.vercel.app/:path*",
      },
    ];
  },
};

export default nextConfig;
