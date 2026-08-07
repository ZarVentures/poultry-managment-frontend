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

export function PermissionsProvider({
  children,
  role,
}: {
  children: ReactNode
  role?: string | null
}) {
  const normalizedRole = normalizeRole(role)
  const isAdmin = normalizedRole === "admin"
  const [loading, setLoading] = useState(!isAdmin)
  const [data, setData] = useState<UserPermissions | null>(null)

  const refresh = useCallback(async () => {
    if (!normalizedRole) {
      setData(null)
      setLoading(false)
      return
    }
    if (isAdmin) {
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
  }, [normalizedRole, isAdmin])

  useEffect(() => {
    refresh()
  }, [refresh])

  const permissions = data?.permissions || {}

  const can = useCallback(
    (resource: string, action: PermissionAction = "read") => {
      if (isAdmin) return true
      const perm = permissions[resource] || DENY
      return getActionFlag(perm, action)
    },
    [isAdmin, permissions],
  )

  const value = useMemo<PermissionsContextValue>(
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

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  )
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext)
  if (!ctx) {
    // Safe fallback when used outside provider (e.g. login page)
    return {
      role: "",
      isAdmin: false,
      loading: false,
      permissions: {},
      can: () => false,
      canRead: () => false,
      canCreate: () => false,
      canUpdate: () => false,
      canDelete: () => false,
      refresh: async () => {},
    } satisfies PermissionsContextValue
  }
  return ctx
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
