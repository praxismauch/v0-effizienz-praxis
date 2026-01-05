"use client"

import useSWR from "swr"
import { toast } from "sonner"

// Types
export interface Permission {
  id: string
  role: string
  permission_key: string
  permission_category: string
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
  created_at: string
  updated_at: string
}

export interface RoleConfig {
  label: string
  color: string
  order: number
}

export interface PermissionsResponse {
  permissions: Permission[]
  stats: {
    totalPermissions: number
    roles: number
    categories: number
    customOverrides: number
  }
  roleConfig: Record<string, RoleConfig>
  categories: string[]
  tableExists: boolean
  error?: string
}

// Fetcher with error handling
const fetcher = async (url: string): Promise<PermissionsResponse> => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || "Fehler beim Laden der Berechtigungen")
  }
  return res.json()
}

export function useSuperAdminPermissions() {
  const { data, error, isLoading, mutate } = useSWR<PermissionsResponse>("/api/super-admin/permissions", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })

  // Update permission
  const updatePermission = async (
    id: string,
    role: string,
    permission_key: string,
    updates: Partial<Permission>,
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/super-admin/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role, permission_key, ...updates }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Fehler beim Aktualisieren")
      }

      // Optimistic update
      await mutate()
      toast.success("Berechtigung aktualisiert")
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Aktualisieren")
      return false
    }
  }

  // Bulk update permissions for a role
  const bulkUpdateRole = async (
    role: string,
    permission_key: string,
    updates: { can_view?: boolean; can_create?: boolean; can_edit?: boolean; can_delete?: boolean },
  ): Promise<boolean> => {
    try {
      const res = await fetch("/api/super-admin/permissions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, permission_key, ...updates }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Fehler beim Aktualisieren")
      }

      await mutate()
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Aktualisieren")
      return false
    }
  }

  // Initialize default permissions
  const initializePermissions = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/super-admin/permissions/initialize", {
        method: "POST",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Fehler beim Initialisieren")
      }

      const result = await res.json()
      await mutate()
      toast.success(result.message || "Berechtigungen initialisiert")
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Initialisieren")
      return false
    }
  }

  // Reset permissions
  const resetPermissions = async (role?: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/super-admin/permissions/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Fehler beim Zurücksetzen")
      }

      const result = await res.json()
      await mutate()
      toast.success(result.message || "Berechtigungen zurückgesetzt")
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Zurücksetzen")
      return false
    }
  }

  // Create new permission
  const createPermission = async (permission: Partial<Permission>): Promise<boolean> => {
    try {
      const res = await fetch("/api/super-admin/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(permission),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Fehler beim Erstellen")
      }

      await mutate()
      toast.success("Berechtigung erstellt")
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Erstellen")
      return false
    }
  }

  // Delete permission
  const deletePermission = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/super-admin/permissions?id=${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Fehler beim Löschen")
      }

      await mutate()
      toast.success("Berechtigung gelöscht")
      return true
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Fehler beim Löschen")
      return false
    }
  }

  // Get permissions grouped by category
  const getPermissionsByCategory = () => {
    if (!data?.permissions) return {}
    return data.permissions.reduce(
      (acc, perm) => {
        if (!acc[perm.permission_category]) {
          acc[perm.permission_category] = []
        }
        acc[perm.permission_category].push(perm)
        return acc
      },
      {} as Record<string, Permission[]>,
    )
  }

  // Get permissions for a specific role
  const getPermissionsForRole = (role: string) => {
    if (!data?.permissions) return []
    return data.permissions.filter((p) => p.role === role)
  }

  return {
    permissions: data?.permissions || [],
    stats: data?.stats,
    roleConfig: data?.roleConfig || {},
    categories: data?.categories || [],
    tableExists: data?.tableExists ?? true,
    tableError: data?.error,
    isLoading,
    error,
    refresh: () => mutate(),
    updatePermission,
    bulkUpdateRole,
    initializePermissions,
    resetPermissions,
    createPermission,
    deletePermission,
    getPermissionsByCategory,
    getPermissionsForRole,
  }
}
