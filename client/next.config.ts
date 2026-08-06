import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    globalNotFound: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.yaagam.in",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
      {
        protocol: "https",
        hostname: "pub-b562a1837efa4ecd9355514d86041756.r2.dev",
        pathname: "/users/yaagam_devotee_avatar_*.webp",
      },
      {
        protocol: "https",
        hostname: "2de93ccc8812390cf4db7a9cc186e9d6.r2.cloudflarestorage.com",
      },
    ],
  },
};

export default nextConfig;
