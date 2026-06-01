import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': resolve(__dirname),
    };
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:3000/api/v1/:path*',
      },
      {
        source: '/accounting',
        destination: 'http://localhost:5173/accounting/',
      },
      {
        source: '/accounting/:path*',
        destination: 'http://localhost:5173/accounting/:path*',
      },
    ];
  },
};

export default nextConfig;
