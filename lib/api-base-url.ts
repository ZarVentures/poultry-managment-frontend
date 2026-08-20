/**
 * Resolves backend API base URL so staging Amplify never accidentally calls prod APIs
 * and prod never calls staging — without editing URLs per deploy.
 *
 * Rules (browser):
 * - `staging.*.amplifyapp.com` → staging backend
 * - `prod.*.amplifyapp.com` → prod backend
 * - `*.amplifyapp.com` (root) → prod backend
 * - Other `*.amplifyapp.com` preview URLs → staging backend (safe default)
 * - `staging.` or `stage.` prefixed custom domains → staging backend
 * - `localhost` / `127.0.0.1` → NEXT_PUBLIC_API_URL or local Nest default
 * - All other custom domains → NEXT_PUBLIC_API_URL or prod default
 *
 * Optional overrides (build-time):
 * - NEXT_PUBLIC_STAGING_API_BASE / NEXT_PUBLIC_PROD_API_BASE / NEXT_PUBLIC_LOCAL_API_BASE
 */

const STAGING_API_BASE =
  process.env.NEXT_PUBLIC_STAGING_API_BASE?.trim() ||
  "https://13.234.140.190.nip.io/staging/api/v1";

const PROD_API_BASE =
  process.env.NEXT_PUBLIC_PROD_API_BASE?.trim() ||
  "https://13.234.140.190.nip.io/api/v1";

const LOCAL_API_BASE =
  process.env.NEXT_PUBLIC_LOCAL_API_BASE?.trim() ||
  "http://localhost:3001/api/v1";

// ─── Custom domain → environment mapping ─────────────────────────────────
// Add/edit your custom staging domain here. Matches with or without "www.".
// Any custom domain NOT listed here falls back to the prod backend.
const CUSTOM_DOMAIN_MAP: Array<{ domain: string; base: string }> = [
  { domain: "poultrysathi.com", base: STAGING_API_BASE },
];

function isAmplifyHost(host: string): boolean {
  return host.endsWith(".amplifyapp.com");
}

function customDomainBackend(host: string): string | null {
  for (const entry of CUSTOM_DOMAIN_MAP) {
    if (host === entry.domain || host.endsWith("." + entry.domain)) {
      return entry.base;
    }
  }
  return null;
}

function amplifyBackendForHost(host: string): string {
  const custom = customDomainBackend(host);
  if (custom) return custom;

  // xxx.amplifyapp.com (no branch prefix) → prod
  if (host.split(".").length === 3) {
    return PROD_API_BASE;
  }
  const branchPrefix = host.substring(0, host.indexOf("."));
  if (branchPrefix === "prod" || branchPrefix === "production") return PROD_API_BASE;
  if (branchPrefix === "staging" || branchPrefix === "stage") return STAGING_API_BASE;
  // Other preview branches → staging (safe default)
  return STAGING_API_BASE;
}

export function getApiBaseUrl(): string {
  const envOverride = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();

    if (isAmplifyHost(host)) {
      return amplifyBackendForHost(host);
    }

    const custom = customDomainBackend(host);
    if (custom) return custom;

    if (host === "localhost" || host === "127.0.0.1") {
      return envOverride ?? LOCAL_API_BASE;
    }

    if (host.startsWith("staging.") || host.startsWith("stage.")) {
      return envOverride ?? STAGING_API_BASE;
    }

    return envOverride ?? PROD_API_BASE;
  }

  return envOverride ?? PROD_API_BASE;
}
