import type { NextConfig } from "next"
import { MEDIA_PREFIX, R2_PUBLIC_BASE } from "./lib/constants"

/**
 * Media is proxied from our own origin rather than loaded straight from R2.
 * Some school and corporate networks block *.r2.dev outright, and serving
 * same-origin also avoids CORS entirely for the Web Audio visualiser and the
 * decoded ambience buffers.
 *
 * This is an edge rewrite, not a serverless function: a page load still costs
 * zero function invocations.
 */
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: `${MEDIA_PREFIX}/:path*`,
        destination: `${R2_PUBLIC_BASE}/:path*`,
      },
    ]
  },
}

export default nextConfig
