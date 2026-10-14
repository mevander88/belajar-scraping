import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Server sumber dapat diakses browser, tetapi tidak stabil saat diambil oleh
    // image optimizer Next.js. Muat langsung agar cover tidak berubah menjadi 500.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "otakudesu.blog", pathname: "/wp-content/uploads/**" },
      { protocol: "https", hostname: "otakudesu.blog", pathname: "/wp-content/themes/**" },
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
