/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', 'nodemailer'],
  images: {
    domains: [
      'cdn.bunny.net',
      'bunnycdn.com',
      'stream-io-cdn.com',
      'getstream.io',
      'localhost',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.bunny.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.getstream.io',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        querystring: false,
        path: false,
        os: false,
        util: false,
        assert: false,
        buffer: false,
        events: false,
        child_process: false,
      };
    }
    return config;
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  trailingSlash: false,
};

module.exports = nextConfig; 