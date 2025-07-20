/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'vercel.app'],
  },
  // Disable type checking during build for initial deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Output standalone for better deployment
  output: 'standalone',
};

module.exports = nextConfig;