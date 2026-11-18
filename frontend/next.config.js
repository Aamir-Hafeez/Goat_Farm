/** @type {import('next').NextConfig} */
const nextConfig = {
  // The Android app bundles the frontend as static files.
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    agentUpgrade: 'security',
  },
};

module.exports = nextConfig;
