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
      {
        source: '/user-dashboard/:userId',
        destination: '/user-dashboard/:userId',
      },
    ];
  },
};

export default nextConfig;