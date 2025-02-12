import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/project-tracker',
        destination: '/',
      },
      {
        source: '/project-timeline',
        destination: '/',
      },
      {
        source: '/user-stats',
        destination: '/',
      },
    ];
  },
};

export default nextConfig;