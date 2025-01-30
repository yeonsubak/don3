import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@electric-sql/pglite', '@electric-sql/pglite-react'],
};

const withNextIntl = createNextIntlPlugin('./app/i18n/request.ts');

export default withNextIntl(nextConfig);
