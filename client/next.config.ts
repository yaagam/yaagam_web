import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
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
    ],
  },
};

export default nextConfig;
