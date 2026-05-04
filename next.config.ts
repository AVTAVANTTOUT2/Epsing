import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https?:\/\/.*\/api\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 3,
          expiration: { maxEntries: 50, maxAgeSeconds: 300 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /\/icons\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'icons-cache',
          expiration: { maxEntries: 20, maxAgeSeconds: 86400 * 30 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /\/_next\/static\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-cache',
          expiration: { maxEntries: 100, maxAgeSeconds: 86400 * 365 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ['better-sqlite3'],
  output: process.env.DOCKER_BUILD ? 'standalone' : undefined,
};

export default withPWA(nextConfig);
