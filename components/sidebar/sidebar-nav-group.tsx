"use client"

import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { SidebarNavItem } from "./sidebar-nav-item"
import type { NavigationGroup, BadgeKey } from "@/lib/sidebar-navigation"

interface SidebarNavGroupProps {
  group: NavigationGroup
  isExpanded: boolean
  sidebarOpen: boolean
  pathname: string
  favorites: string[]
  badgeCounts: Record<BadgeKey, number>
  badgeVisibility: Record<string, boolean>
  sidebarPermissions: Record<string, boolean>
  onToggleGroup: (groupId: string) => void
  onNavigate: (href: string) => void
  onToggleFavorite: (href: string) => void
}

export function SidebarNavGroup({
  group,
  isExpanded,
  sidebarOpen,
  pathname,
  favorites,
  badgeCounts,
  badgeVisibility,
  sidebarPermissions,
  onToggleGroup,
  onNavigate,
  onToggleFavorite,
}: SidebarNavGroupProps) {
  return (
    <div className="px-3 py-2 relative border-b border-sidebar-border/20 last:border-b-0">
      <button
        onClick={() => onToggleGroup(group.id)}
        className="flex w-full items-center justify-between px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
      >
        {sidebarOpen && <span>{group.label}</span>}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {isExpanded && (
        <div className="mt-1 space-y-0.5">
          {group.items.map((item) => {
            if (item.key && sidebarPermissions[item.key] === false) return null

            const badgeKey = (item.badge || item.key || "") as BadgeKey
            const badgeCount =
              badgeVisibility[badgeKey] !== false
                ? badgeCounts[badgeKey] || 0
                : 0

            return (
              <SidebarNavItem
                key={item.href}
                item={item}
                isActive={pathname === item.href}
                isFavorite={favorites.includes(item.href)}
                badgeCount={badgeCount}
                sidebarOpen={sidebarOpen}
                onNavigate={onNavigate}
                onToggleFavorite={onToggleFavorite}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
