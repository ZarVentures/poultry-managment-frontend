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
    const ACCT_DEST = process.env.NEXT_PUBLIC_ACCT_REWRITE_DEST || 'http://localhost:5173';
    const isDev = process.env.NODE_ENV !== 'production';

    const rules = [
      {
        source: '/api/v1/:path*',
        destination: `${API_DEST}/api/v1/:path*`,
      },
    ];

    // Accounting frontend (Vite dev server or hosted static)
    if (isDev) {
      rules.push(
        {
          source: '/@vite/:path*',
          destination: `${ACCT_DEST}/@vite/:path*`,
        },
        {
          source: '/accounting',
          destination: `${ACCT_DEST}/accounting/`,
        },
        {
          source: '/accounting/:path*',
          destination: `${ACCT_DEST}/accounting/:path*`,
        }
      );
    } else {
      // In production, serve built accounting frontend from /accounting/*
      // Or proxy to hosted URL — set NEXT_PUBLIC_ACCT_REWRITE_DEST
      rules.push(
        {
          source: '/accounting',
          destination: `${ACCT_DEST}/accounting/`,
        },
        {
          source: '/accounting/:path*',
          destination: `${ACCT_DEST}/accounting/:path*`,
        }
      );
    }

    return rules;
  },
};

export default nextConfig;
