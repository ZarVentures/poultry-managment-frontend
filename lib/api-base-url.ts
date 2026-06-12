/**
 * Resolves backend API base URL so staging Amplify never accidentally calls prod APIs
 * and prod never calls staging — without editing URLs per deploy.
 *
 * Rules (browser):
 * - `*.amplifyapp.com` + host starts with `staging.` or `stage.` → staging backend
 * - `*.amplifyapp.com` + host starts with `prod.` or `production.` → prod backend
 * - Other Amplify preview URLs → staging backend (safe default)
 * - `localhost` / `127.0.0.1` → NEXT_PUBLIC_API_URL or local Nest default
 * - Custom domains → NEXT_PUBLIC_API_URL or prod default (set env for non-standard setups)
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
  "http://localhost:3001/api";

function isAmplifyHost(host: string): boolean {
  return host.endsWith(".amplifyapp.com");
}

function amplifyBackendForHost(host: string): string {
  const isProdFrontend =
    host.startsWith("prod.") || host.startsWith("production.");
  const isStagingFrontend =
    host.startsWith("staging.") || host.startsWith("stage.");
  if (isProdFrontend) return PROD_API_BASE;
  if (isStagingFrontend) return STAGING_API_BASE;
  // PR previews / feature branches — avoid hitting prod by mistake
  return STAGING_API_BASE;
}

export function getApiBaseUrl(): string {
  const envOverride = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();

    if (isAmplifyHost(host)) {
      return amplifyBackendForHost(host);
    }

    if (host === "localhost" || host === "127.0.0.1") {
      return envOverride ?? LOCAL_API_BASE;
    }

    return envOverride ?? PROD_API_BASE;
  }

  return envOverride ?? PROD_API_BASE;
}
