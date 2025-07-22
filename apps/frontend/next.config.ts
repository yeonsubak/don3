import { SYNC_SERVER_URL } from '@/lib/constants';
import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const corsHeaders = SYNC_SERVER_URL
  ? [
      {
        key: 'Access-Control-Allow-Origin',
        value: SYNC_SERVER_URL,
      },
      {
        key: 'Access-Control-Allow-Methods',
        value: 'GET, POST, PUT, DELETE',
      },
      {
        key: 'Access-Control-Allow-Headers',
        value: 'Content-Type, Authorization',
      },
    ]
  : [];

const nextConfig: NextConfig = {
  serverExternalPackages: ['@electric-sql/pglite', '@electric-sql/pglite-react'],
  async headers() {
    return [
      {
        source: '/(.*)',
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
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          ...corsHeaders,
        ],
      },
    ];
  },
};

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
});

const withNextIntl = createNextIntlPlugin('./app/i18n/request.ts');

export default withSerwist(withNextIntl(nextConfig));
