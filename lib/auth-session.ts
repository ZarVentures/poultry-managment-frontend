import type { User } from "@/lib/api"

export type TwoFactorPending = {
  status: "2FA_REQUIRED"
  tempToken: string
}

export type AuthSuccess = {
  accessToken: string
  user: User
}

export type AuthResponse = AuthSuccess | TwoFactorPending

export type PostLoginResult =
  | { ok: true; href: string }
  | { ok: false; message: string }

const NO_ORG_STAFF_MESSAGE =
  "Your account is not linked to an organization. Ask an admin to invite you."

export function isTwoFactorPending(response: unknown): response is TwoFactorPending {
  return (
    typeof response === "object" &&
    response !== null &&
    "status" in response &&
    (response as TwoFactorPending).status === "2FA_REQUIRED"
  )
}

export function persistSession(accessToken: string, user: User) {
  if (typeof window === "undefined") return
  const organizationId = user.organizationId || user.tenantId
  const tenantId = user.tenantId || user.organizationId
  localStorage.setItem("token", accessToken)
  localStorage.setItem(
    "user",
    JSON.stringify({ ...user, tenantId, organizationId }),
  )
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("user")
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function getOrganizationId(user?: User | null): string | null {
  const u = user ?? getStoredUser()
  if (!u) return null
  const id = u.tenantId || u.organizationId || null
  return id ? String(id) : null
}

export function normalizeAuthRole(role?: string | null): string {
  return (role || "").trim().toLowerCase()
}

export function resolvePostLoginDestination(user: User): PostLoginResult {
  const org = getOrganizationId(user)
  if (org) return { ok: true, href: "/dashboard" }

  const role = normalizeAuthRole(user.role)
  if (role === "admin" || role === "") {
    return { ok: true, href: "/business-setup" }
  }

  return { ok: false, message: NO_ORG_STAFF_MESSAGE }
}

/** Persist session only when the user may enter the app. */
export function finishAuth(accessToken: string, user: User): PostLoginResult {
  const dest = resolvePostLoginDestination(user)
  if (!dest.ok) return dest
  persistSession(accessToken, user)
  return dest
}

export function applyAuthResponse(
  response: AuthResponse,
  handlers: {
    onTwoFactor: (tempToken: string) => void
    onSuccess: (href: string) => void
    onBlocked: (message: string) => void
  },
) {
  if (isTwoFactorPending(response)) {
    handlers.onTwoFactor(response.tempToken)
    return
  }
  const result = finishAuth(response.accessToken, response.user)
  if (!result.ok) {
    handlers.onBlocked(result.message)
    return
  }
  handlers.onSuccess(result.href)
}
