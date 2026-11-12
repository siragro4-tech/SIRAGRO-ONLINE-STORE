import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimisation — Supabase Storage will be added here once configured
  images: {
    formats: ["image/webp", "image/avif"],
  },
};

export default nextConfig;

