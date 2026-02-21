"use client"
// cache-bust v53
/**
 * AppSidebar - Main application sidebar navigation
 * Refactored: preferences/favorites logic in hooks/use-sidebar-preferences.ts
 *             permission mapping in lib/sidebar-permissions.ts
 */
import { Sidebar, useSidebar } from "@/components/ui/sidebar"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useUser } from "@/contexts/user-context"
import { useTranslation } from "@/contexts/translation-context"
import { TooltipProvider } from "@/components/ui/tooltip"
import { isSuperAdminRole } from "@/lib/auth-utils"
import { useSidebarSettings } from "@/contexts/sidebar-settings-context"
import { useFeatureBetaFlags } from "@/hooks/use-feature-beta-flags"
import { usePermissions } from "@/hooks/use-permissions"
import { useSidebarPreferences } from "@/hooks/use-sidebar-preferences"
import { buildSidebarPermissions } from "@/lib/sidebar-permissions"

import {
  AppSidebarHeader,
  SidebarTourButton,
  SidebarFavorites,
  SidebarNavGroup,
} from "@/components/sidebar"
import { BetaNoticeButton } from "@/components/beta-notice-button"

import {
  getNavigationGroups,
  type NavigationItem,
} from "@/lib/sidebar-navigation"

interface AppSidebarProps {
  className?: string
}

export function AppSidebar({ className }: AppSidebarProps) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser } = useUser()
  const { singleGroupMode } = useSidebarSettings()
  const betaFlags = useFeatureBetaFlags()
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar()
  const { checkPermission } = usePermissions()

  const {
    expandedGroups,
    setExpandedGroups,
    favorites,
    badgeCounts,
    badgeVisibility,
    scrollContainerRef,
    toggleFavorite,
  } = useSidebarPreferences()

  const isSuperAdmin = isSuperAdminRole(currentUser?.role) || currentUser?.is_super_admin === true
  const sidebarGroups = getNavigationGroups(t)
  const sidebarPermissions = buildSidebarPermissions(sidebarGroups, checkPermission)

  // Build list of all visible nav items for favorites lookup
  const allNavItems = sidebarGroups.flatMap((group) =>
    group.items.filter((item) => !item.key || sidebarPermissions[item.key] !== false),
  )
  const favoriteItems = allNavItems.filter((item) => favorites.includes(item.href))

  const handleNavigation = (href: string) => router.push(href)

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      if (prev.includes(groupId)) return prev.filter((g) => g !== groupId)
      return singleGroupMode ? [groupId] : [...prev, groupId]
    })
  }

  return (
    <TooltipProvider>
      <Sidebar className={cn("border-r border-sidebar-border", className)}>
        <AppSidebarHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isSuperAdmin={isSuperAdmin}
          pathname={pathname}
        />

        <SidebarTourButton sidebarOpen={sidebarOpen} />

        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto sidebar-scrollbar">
          <div className="py-2">
            <SidebarFavorites
              favoriteItems={favoriteItems as NavigationItem[]}
              pathname={pathname}
              sidebarOpen={sidebarOpen}
              badgeCounts={badgeCounts}
              badgeVisibility={badgeVisibility}
              onNavigate={handleNavigation}
              onToggleFavorite={toggleFavorite}
              t={t}
            />

            {sidebarGroups.map((group) => (
              <SidebarNavGroup
                key={group.id}
                group={group}
                isExpanded={expandedGroups.includes(group.id)}
                sidebarOpen={sidebarOpen}
                pathname={pathname}
                favorites={favorites}
                badgeCounts={badgeCounts}
                badgeVisibility={badgeVisibility}
                sidebarPermissions={sidebarPermissions}
                betaFlags={betaFlags}
                onToggleGroup={toggleGroup}
                onNavigate={handleNavigation}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </div>

        <BetaNoticeButton sidebarOpen={sidebarOpen} />
      </Sidebar>
    </TooltipProvider>
  )
}

export default AppSidebar
