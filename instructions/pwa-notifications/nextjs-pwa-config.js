// next.config.js
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  
  // Caching strategies for employee directory and messaging
  runtimeCaching: [
    // Employee data - Network first, fallback to cache
    {
      urlPattern: /^https:\/\/.*\/api\/employees/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'employee-data',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
        networkTimeoutSeconds: 10,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    
    // Messages - Cache first for offline viewing
    {
      urlPattern: /^https:\/\/.*\/api\/messages/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'messages-cache',
        expiration: {
          maxEntries: 1000,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
      },
    },
    
    // Profile images - Cache first
    {
      urlPattern: /\/_next\/image\?url=.+$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'employee-images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    
    // Static resources
    {
      urlPattern: /\/_next\/(static|image)\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
  ],
  
  // Fallback pages for offline mode
  fallbacks: {
    document: '/offline',
    image: '/images/offline-placeholder.png',
    font: '/fonts/fallback.woff2',
  },
  
  // Custom worker configuration
  workboxOptions: {
    disableDevLogs: true,
    clientsClaim: true,
    skipWaiting: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Required for PWA features
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
      ],
    },
  ],
};

module.exports = withPWA(nextConfig);