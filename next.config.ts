import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-699441ce0cfb40449cc458823a3f1ed2.r2.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/media/:path*',
        destination: 'https://pub-699441ce0cfb40449cc458823a3f1ed2.r2.dev/lofi-station/:path*',
      },
    ];
  },
};

export default nextConfig;
