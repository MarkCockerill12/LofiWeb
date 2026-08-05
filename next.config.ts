import type { NextConfig } from "next"
import { MEDIA_PREFIX, R2_PUBLIC_BASE } from "./lib/constants"

const r2Origin = new URL(R2_PUBLIC_BASE)

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: r2Origin.protocol.replace(":", "") as "https" | "http",
        hostname: r2Origin.hostname,
        port: "",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        // Same-origin proxy: dodges CORS and firewalls that block *.r2.dev.
        source: `${MEDIA_PREFIX}/:path*`,
        destination: `${R2_PUBLIC_BASE}/:path*`,
      },
    ]
  },
}

export default nextConfig
