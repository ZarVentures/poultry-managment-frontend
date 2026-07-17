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

    return rules;
  },
};

export default nextConfig;