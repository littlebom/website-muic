/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: false,
    minimumCacheTTL: 0, // Don't cache optimized images (fixes upload display issue)
    domains: [],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  // Enable standalone output for Docker
  output: 'standalone',
  // Disable static page generation during build (for Docker)
  // This prevents database connection errors during build time
  experimental: {
    // Force dynamic rendering for all pages
  },
  // Skip static page generation
  skipTrailingSlashRedirect: true,
  // Disable telemetry
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Webpack config for server-side modules
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'mysql2' and other Node.js modules on client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
        crypto: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
