import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
    NEXT_PUBLIC_SETUP_KEY: process.env.SETUP_KEY,
  },
};

export default nextConfig;
