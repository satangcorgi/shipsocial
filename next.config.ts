import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Tell Turbopack exactly where the project root is.
  turbopack: {
    root: path.resolve(__dirname),
  },

  // Nice-to-haves for CI/deploys; keep builds green.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;