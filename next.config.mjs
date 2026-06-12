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
    const API_DEST = process.env.NEXT_PUBLIC_API_REWRITE_DEST || 'http://localhost:3001';
    const isDev = process.env.NODE_ENV !== 'production';

    const rules = [
      {
        source: '/api/v1/:path*',
        destination: `${API_DEST}/api/v1/:path*`,
      },
    ];

    // Accounting frontend
    if (isDev) {
      // Dev: proxy to Vite dev server
      rules.push(
        {
          source: '/@vite/:path*',
          destination: 'http://localhost:5173/@vite/:path*',
        },
        {
          source: '/accounting',
          destination: 'http://localhost:5173/accounting/',
        },
        {
          source: '/accounting/:path*',
          destination: 'http://localhost:5173/accounting/:path*',
        }
      );
    } else {
      // Prod: serve built static files from public/accounting/
      // Build the accounting frontend with VITE_BASE_PATH=/accounting/
      // and copy output to public/accounting/ before deploy
      rules.push({
        source: '/accounting',
        destination: '/accounting/index.html',
      });
    }

    return rules;
  },
};

export default nextConfig;
