"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useUser } from "@/contexts/user-context"
import { normalizeRoleKey, type RolePermission, type PermissionAction } from "@/lib/roles"

interface PermissionState {
  permissions: RolePermission[]
  isLoading: boolean
  error: string | null
}

interface PermissionCheck {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

export function usePermissions() {
  const { user } = useUser()
  const [state, setState] = useState<PermissionState>({
    permissions: [],
    isLoading: true,
    error: null,
  })

  const userRole = useMemo(() => normalizeRoleKey(user?.role), [user?.role])

  // Fetch permissions for the current user's role
  const fetchPermissions = useCallback(async () => {
    if (!userRole) {
      setState((prev) => ({ ...prev, isLoading: false }))
      return
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      const response = await fetch("/api/role-permissions", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Berechtigungen konnten nicht geladen werden")
      }

      const data = await response.json()
      const allPermissions: RolePermission[] = data.permissions || []

      // Filter permissions for current user's role
      const userPermissions = allPermissions.filter((p: RolePermission) => normalizeRoleKey(p.role) === userRole)

      setState({
        permissions: userPermissions,
        isLoading: false,
        error: null,
      })
    } catch (err) {
      console.error("Error fetching permissions:", err)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Fehler beim Laden der Berechtigungen",
      }))
    }
  }, [userRole])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  /**
   * Check if user has a specific permission for a feature
   */
  const checkPermission = useCallback(
    (permissionKey: string, action: PermissionAction = "can_view"): boolean => {
      // Super admin always has all permissions
      if (userRole === "superadmin") return true

      const permission = state.permissions.find((p) => p.permission_key === permissionKey)

      if (!permission) {
        switch (userRole) {
          case "practiceadmin":
          case "admin":
            return action === "can_view" || action === "can_create" || action === "can_edit"
          case "manager":
            return action === "can_view" || action === "can_create"
          case "member":
            return action === "can_view"
          case "viewer":
            return action === "can_view"
          case "extern":
            return false
          default:
            return false
        }
      }

      return permission[action] === true
    },
    [state.permissions, userRole],
  )

  /**
   * Get all permissions for a specific feature
   */
  const getPermissions = useCallback(
    (permissionKey: string): PermissionCheck => {
      // Super admin always has all permissions
      if (userRole === "superadmin") {
        return {
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
        }
      }

      const permission = state.permissions.find((p) => p.permission_key === permissionKey)

      if (!permission) {
        switch (userRole) {
          case "practiceadmin":
          case "admin":
            return { canView: true, canCreate: true, canEdit: true, canDelete: false }
          case "manager":
            return { canView: true, canCreate: true, canEdit: true, canDelete: false }
          case "member":
            return { canView: true, canCreate: true, canEdit: false, canDelete: false }
          case "viewer":
            return { canView: true, canCreate: false, canEdit: false, canDelete: false }
          case "extern":
            return { canView: false, canCreate: false, canEdit: false, canDelete: false }
          default:
            return { canView: false, canCreate: false, canEdit: false, canDelete: false }
        }
      }

      return {
        canView: permission.can_view,
        canCreate: permission.can_create,
        canEdit: permission.can_edit,
        canDelete: permission.can_delete,
      }
    },
    [state.permissions, userRole],
  )

  /**
   * Check multiple permissions at once
   */
  const checkMultiplePermissions = useCallback(
    (permissionKeys: string[], action: PermissionAction = "can_view"): Record<string, boolean> => {
      const result: Record<string, boolean> = {}
      permissionKeys.forEach((key) => {
        result[key] = checkPermission(key, action)
      })
      return result
    },
    [checkPermission],
  )

  /**
   * Check if user can access a feature category
   */
  const canAccessCategory = useCallback(
    (category: string): boolean => {
      if (userRole === "superadmin") return true
      const categoryPermissions = state.permissions.filter((p) => p.permission_category === category)
      return categoryPermissions.some((p) => p.can_view)
    },
    [state.permissions, userRole],
  )

  return {
    permissions: state.permissions,
    isLoading: state.isLoading,
    error: state.error,
    userRole,
    checkPermission,
    getPermissions,
    checkMultiplePermissions,
    canAccessCategory,
    refresh: fetchPermissions,
  }
}

/**
 * Hook to check a single permission - useful for conditional rendering
 */
export function useHasPermission(
  permissionKey: string,
  action: PermissionAction = "can_view",
): { hasPermission: boolean; isLoading: boolean } {
  const { checkPermission, isLoading } = usePermissions()

  const hasPermission = useMemo(() => checkPermission(permissionKey, action), [checkPermission, permissionKey, action])

  return { hasPermission, isLoading }
}

/**
 * Hook to get permission set for a feature
 */
export function useFeaturePermissions(permissionKey: string): PermissionCheck & { isLoading: boolean } {
  const { getPermissions, isLoading } = usePermissions()

  const permissions = useMemo(() => getPermissions(permissionKey), [getPermissions, permissionKey])

  return { ...permissions, isLoading }
}

export default usePermissions
