import { settingsApi, tenantsApi } from "@/lib/api"

export type OrgInfo = {
  name: string
  location: string
  phone: string
}

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function orgInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "PS"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

/** Latest Settings farm name wins; tenant name is fallback. */
export async function fetchOrgInfo(): Promise<OrgInfo> {
  const info: OrgInfo = { name: "", location: "", phone: "" }

  try {
    const res = await settingsApi.getAll()
    const list = Array.isArray(res) ? res : []
    const map = Object.fromEntries(list.map((s: any) => [s.key, s.value]))
    info.name = (map.farmName || map.company_name || "").trim()
    info.location = (map.farmLocation || map.company_address || "").trim()
    info.phone = (map.farmPhone || map.company_phone || "").trim()
  } catch {
    // Fall back to tenant below.
  }

  if (!info.name || !info.location || !info.phone) {
    try {
      const tenant = await tenantsApi.getMe()
      if (tenant) {
        if (!info.name) info.name = (tenant.name || "").trim()
        if (!info.location) info.location = (tenant.address || "").trim()
        if (!info.phone) info.phone = (tenant.phone || "").trim()
      }
    } catch {
      // Keep settings values.
    }
  }

  return info
}
