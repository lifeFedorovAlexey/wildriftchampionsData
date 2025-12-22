import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
