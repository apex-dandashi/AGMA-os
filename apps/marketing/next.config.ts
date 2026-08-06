import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Static export: flat HTML served by Hostinger (Path 1, docs/05 §A1).
  output: 'export',
  // Each route exports as <route>/index.html so extensionless deep links
  // (e.g. /pricing) resolve on Apache-style static hosting.
  trailingSlash: true,
  // next/image optimization needs a server; required for static export.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
