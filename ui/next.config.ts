import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "game.gtimg.cn",
        pathname: "/images/**",
      },
      // на всякий, если попадётся без subdomain (у тебя в отчёте было "gtimg.cn")
      {
        protocol: "https",
        hostname: "gtimg.cn",
        pathname: "/**",
      },
    ],
  },

  async rewrites() {
    return [
      {
        // всё что начинается с /wr-api/... прокинем на внешний API
        source: "/wr-api/:path*",
        destination: "https://wr-api.vercel.app/:path*",
      },
    ];
  },
};

export default nextConfig;
