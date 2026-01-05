"use client"

import type { ReactNode } from "react"
import { useHasPermission, useFeaturePermissions } from "@/hooks/use-permissions"
import type { PermissionAction } from "@/lib/roles"

interface PermissionGateProps {
  /**
   * The permission key to check (e.g., "team", "calendar", "billing")
   */
  permissionKey: string
  /**
   * The action to check (default: "can_view")
   */
  action?: PermissionAction
  /**
   * Content to render if user has permission
   */
  children: ReactNode
  /**
   * Optional content to render if user doesn't have permission
   */
  fallback?: ReactNode
  /**
   * If true, shows loading state while checking permissions
   */
  showLoading?: boolean
  /**
   * Custom loading component
   */
  loadingComponent?: ReactNode
}

/**
 * Component to conditionally render content based on permissions
 *
 * @example
 * ```tsx
 * <PermissionGate permissionKey="team" action="can_create">
 *   <Button>Neues Teammitglied</Button>
 * </PermissionGate>
 *
 * <PermissionGate permissionKey="billing" fallback={<UpgradePrompt />}>
 *   <BillingSettings />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  permissionKey,
  action = "can_view",
  children,
  fallback = null,
  showLoading = false,
  loadingComponent,
}: PermissionGateProps) {
  const { hasPermission, isLoading } = useHasPermission(permissionKey, action)

  if (isLoading && showLoading) {
    return <>{loadingComponent || <PermissionLoadingSkeleton />}</>
  }

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Hook-based permission check for more complex scenarios
 */
export function usePermissionGate(permissionKey: string, action: PermissionAction = "can_view") {
  const { hasPermission, isLoading } = useHasPermission(permissionKey, action)
  return { hasPermission, isLoading }
}

/**
 * Component to show/hide action buttons based on CRUD permissions
 */
interface ActionPermissionsProps {
  permissionKey: string
  children: (permissions: {
    canView: boolean
    canCreate: boolean
    canEdit: boolean
    canDelete: boolean
    isLoading: boolean
  }) => ReactNode
}

export function ActionPermissions({ permissionKey, children }: ActionPermissionsProps) {
  const permissions = useFeaturePermissions(permissionKey)
  return <>{children(permissions)}</>
}

/**
 * Simple loading skeleton for permission checks
 */
function PermissionLoadingSkeleton() {
  return <div className="animate-pulse bg-muted rounded h-8 w-24" />
}

/**
 * No access fallback component
 */
export function NoAccessFallback({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-4 text-muted-foreground text-sm">
      {message || "Keine Berechtigung für diesen Bereich"}
    </div>
  )
}

export default PermissionGate
