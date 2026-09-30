import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Card PNGs are served from /public/cards/* — no remote loaders needed.
    unoptimized: true,
  },
};

export default nextConfig;
