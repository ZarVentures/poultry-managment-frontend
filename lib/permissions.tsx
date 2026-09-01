"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  permissionsApi,
  type PermissionCheck,
  type UserPermissions,
} from "@/lib/api"

export const PERMISSION_RESOURCES = [
  "dashboard",
  "purchases",
  "sales",
  "godown",
  "mortality",
  "expenses",
  "reports",
  "billing",
  "farmers",
  "retailers",
  "vehicles",
  "users",
  "settings",
] as const

export type PermissionResource = (typeof PERMISSION_RESOURCES)[number]
export type PermissionAction = "create" | "read" | "update" | "delete"

const DENY: PermissionCheck = {
  canCreate: false,
  canRead: false,
  canUpdate: false,
  canDelete: false,
}

const EMPTY_PERMISSIONS: Record<string, PermissionCheck> = {}

const ALLOW_ALL: PermissionCheck = {
  canCreate: true,
  canRead: true,
  canUpdate: true,
  canDelete: true,
}

type PermissionsContextValue = {
  role: string
  isAdmin: boolean
  loading: boolean
  permissions: Record<string, PermissionCheck>
  can: (resource: string, action?: PermissionAction) => boolean
  canRead: (resource: string) => boolean
  canCreate: (resource: string) => boolean
  canUpdate: (resource: string) => boolean
  canDelete: (resource: string) => boolean
  refresh: () => Promise<void>
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null)

function normalizeRole(role?: string | null) {
  return (role || "").trim().toLowerCase()
}

function readRoleFromStorage() {
  if (typeof window === "undefined") return ""
  try {
    const raw = localStorage.getItem("user")
    if (!raw) return ""
    const user = JSON.parse(raw)
    return normalizeRole(user?.role)
  } catch {
    return ""
  }
}

function getActionFlag(perm: PermissionCheck, action: PermissionAction) {
  switch (action) {
    case "create":
      return perm.canCreate
    case "update":
      return perm.canUpdate
    case "delete":
      return perm.canDelete
    case "read":
    default:
      return perm.canRead
  }
}

function usePermissionsState(
  roleProp?: string | null,
  enabled: boolean = true,
): PermissionsContextValue {
  const [storedRole, setStoredRole] = useState(() =>
    enabled && !roleProp ? readRoleFromStorage() : "",
  )
  const normalizedRole = normalizeRole(roleProp) || storedRole
  const isAdmin = normalizedRole === "admin"
  const [loading, setLoading] = useState(() => {
    if (!enabled) return false
    const role = normalizeRole(roleProp) || readRoleFromStorage()
    return role !== "admin"
  })
  const [data, setData] = useState<UserPermissions | null>(null)

  useEffect(() => {
    if (!enabled) return
    if (!roleProp) setStoredRole(readRoleFromStorage())
  }, [roleProp, enabled])

  const refresh = useCallback(async () => {
    if (!enabled) return
    const role = normalizeRole(roleProp) || readRoleFromStorage()
    if (!roleProp) setStoredRole(role)

    if (!role) {
      setData(null)
      setLoading(false)
      return
    }
    if (role === "admin") {
      setData(null)
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const perms = await permissionsApi.getMyPermissions()
      setData(perms)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [roleProp, enabled])

  useEffect(() => {
    refresh()
  }, [refresh])

  const permissions = data?.permissions || EMPTY_PERMISSIONS

  const can = useCallback(
    (resource: string, action: PermissionAction = "read") => {
      if (isAdmin) return true
      const perm = permissions[resource] || DENY
      return getActionFlag(perm, action)
    },
    [isAdmin, permissions],
  )

  return useMemo<PermissionsContextValue>(
    () => ({
      role: normalizedRole,
      isAdmin,
      loading,
      permissions,
      can,
      canRead: (resource) => can(resource, "read"),
      canCreate: (resource) => can(resource, "create"),
      canUpdate: (resource) => can(resource, "update"),
      canDelete: (resource) => can(resource, "delete"),
      refresh,
    }),
    [normalizedRole, isAdmin, loading, permissions, can, refresh],
  )
}

export function PermissionsProvider({
  children,
  role,
}: {
  children: ReactNode
  role?: string | null
}) {
  const value = usePermissionsState(role, true)
  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}

/**
 * Works both inside PermissionsProvider and on pages that call it
 * above DashboardLayout (common pattern in this app).
 * Previously returned all-false outside provider — which hid Create User.
 */
export function usePermissions() {
  const ctx = useContext(PermissionsContext)
  // Hooks must run unconditionally; skip fetch when provider already exists
  const standalone = usePermissionsState(undefined, ctx === null)
  return ctx ?? standalone
}

/** Full CRUD for admin; otherwise look up resource row. */
export function resolvePermission(
  isAdmin: boolean,
  permissions: Record<string, PermissionCheck>,
  resource: string,
): PermissionCheck {
  if (isAdmin) return ALLOW_ALL
  return permissions[resource] || DENY
}
