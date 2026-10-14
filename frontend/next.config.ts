import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "otakudesu.blog", pathname: "/wp-content/uploads/**" }],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
