import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Static export (SPA-style): all data via RLS-protected Supabase queries
  // from the browser — same hosting model as apps/marketing.
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@agma/ui', '@agma/db', '@agma/legal-templates'],
};

export default nextConfig;
