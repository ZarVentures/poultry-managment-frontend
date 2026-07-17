import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": resolve(__dirname),
    };
    return config;
  },

  async rewrites() {
    const API_BASE =
      process.env.NEXT_PUBLIC_API_REWRITE_DEST || "http://localhost:3001";

    // const ACCT_API_BASE =
    //   process.env.NEXT_PUBLIC_ACCT_API_DEST || "http://13.232.247.9:3000";
    const rules = [];

    /**
     * =========================
     * MAIN BACKEND API (POULTRY / MAIN SYSTEM)
     * =========================
     */
    rules.push({
      source: "/api/v1/:path*",
      destination: `${API_BASE}/api/v1/:path*`,
    });

    // /**
    //  * =========================
    //  * ACCOUNTING API (FIXED)
    //  * IMPORTANT: FORCE /api/v1 consistency
    //  * =========================
    //  */
    // rules.push({
    //   source: "/accounting-api/:path*",
    //   destination: `${ACCT_API_BASE}/api/:path*`,
    // });

    // /**
    //  * =========================
    //  * ACCOUNTING FRONTEND SPA ROUTES
    //  * =========================
    //  */
    // rules.push(
    //   {
    //     source: "/accounting",
    //     destination: "/accounting/index.html",
    //   },
    //   {
    //     source: "/accounting/:path*",
    //     destination: "/accounting/index.html",
    //   }
    // );
    return rules;
  },
};

export default nextConfig;