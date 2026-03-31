import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@mosaic/ui", "@mosaic/db"],
}

export default nextConfig
