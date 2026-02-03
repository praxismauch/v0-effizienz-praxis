"use client"

import { Star, ExternalLink } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import type { NavigationItem, BadgeKey } from "@/lib/sidebar-navigation"

interface SidebarFavoritesProps {
  favoriteItems: NavigationItem[]
  pathname: string
  sidebarOpen: boolean
  badgeCounts: Record<BadgeKey, number>
  badgeVisibility: Record<string, boolean>
  onNavigate: (href: string) => void
  onToggleFavorite: (href: string) => void
  t: (key: string, fallback: string) => string
}

export function SidebarFavorites({
  favoriteItems,
  pathname,
  sidebarOpen,
  badgeCounts,
  badgeVisibility,
  onNavigate,
  onToggleFavorite,
  t,
}: SidebarFavoritesProps) {
  if (favoriteItems.length === 0) return null

  return (
    <div className="px-3 py-2 relative border-b border-sidebar-border/20">
      <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-amber-500">
        <Star className="h-3.5 w-3.5 fill-amber-500" />
        {sidebarOpen && <span>{t("sidebar.favorites", "Favoriten")}</span>}
      </div>
      <div className="mt-1 space-y-0.5">
        {favoriteItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          const badgeKey = (item.badge || item.key || "") as BadgeKey
          const badgeCount =
            badgeVisibility[badgeKey] !== false ? badgeCounts[badgeKey] || 0 : 0

          return (
            <ContextMenu key={`fav-${item.href}`}>
              <ContextMenuTrigger asChild>
                <div className="relative group">
                  <Link
                    href={item.href}
                    onClick={() => onNavigate(item.href)}
                    className={cn(
                      "flex items-center gap-3 rounded-md py-2 text-sm transition-all hover:translate-x-0.5",
                      "pl-6 pr-3",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      !sidebarOpen && "justify-center px-2",
                      sidebarOpen && badgeCount > 0 && "pr-10"
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {sidebarOpen && (
                      <span className="flex-1 truncate">{item.name}</span>
                    )}
                  </Link>
                  {sidebarOpen && badgeCount > 0 && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                      {badgeCount > 99 ? "99+" : badgeCount}
                    </span>
                  )}
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-48">
                <ContextMenuItem
                  onClick={() => onToggleFavorite(item.href)}
                  className="text-destructive focus:text-destructive"
                >
                  <Star className="mr-2 h-4 w-4" />
                  Aus Favoriten entfernen
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => window.open(item.href, "_blank")}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  In neuem Tab öffnen
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          )
        })}
      </div>
    </div>
  )
}
