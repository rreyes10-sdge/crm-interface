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
        source: '/project-summary',
        destination: '/',
      },
      {
        source: '/user-overview',
        destination: '/',
      },
      {
        source: '/ev-calculator',
        destination: '/',
      },
    ];
  },
};

export default nextConfig;