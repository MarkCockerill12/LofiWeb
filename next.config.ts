import type { NextConfig } from "next"

/**
 * Deliberately minimal. Media and the station manifest are fetched by the browser
 * straight from the public R2 bucket (see NEXT_PUBLIC_R2_URL), so there is no
 * rewrite proxying asset bytes through the app host and eating its bandwidth.
 *
 * That does mean the bucket must send permissive CORS headers — the visualiser
 * reads audio via the Web Audio API and ambience is decoded from fetched buffers.
 * The required policy is documented in .env.example.
 */
const nextConfig: NextConfig = {}

export default nextConfig
