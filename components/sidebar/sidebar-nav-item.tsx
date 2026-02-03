"use client"

import Link from "next/link"
import { Star, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import type { NavigationItem } from "@/lib/sidebar-navigation"

interface SidebarNavItemProps {
  item: NavigationItem
  isActive: boolean
  isFavorite: boolean
  badgeCount: number
  sidebarOpen: boolean
  onNavigate: (href: string) => void
  onToggleFavorite: (href: string) => void
  showFavoriteIndicator?: boolean
  indent?: boolean
}

export function SidebarNavItem({
  item,
  isActive,
  isFavorite,
  badgeCount,
  sidebarOpen,
  onNavigate,
  onToggleFavorite,
  showFavoriteIndicator = true,
  indent = true,
}: SidebarNavItemProps) {
  const Icon = item.icon

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="relative group">
          <Link
            href={item.href}
            onClick={() => onNavigate(item.href)}
            className={cn(
              "flex items-center gap-3 rounded-md py-2 text-sm transition-all hover:translate-x-0.5",
              indent ? "pl-6 pr-3" : "px-3",
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              !sidebarOpen && "justify-center px-2",
              sidebarOpen && badgeCount > 0 && "pr-10"
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {sidebarOpen && (
              <span className="flex-1 truncate flex items-center gap-2">
                {item.name}
                {showFavoriteIndicator && isFavorite && (
                  <Star className="h-3 w-3 fill-amber-500 text-amber-500 flex-shrink-0" />
                )}
              </span>
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
        <ContextMenuItem onClick={() => onToggleFavorite(item.href)}>
          {isFavorite ? (
            <>
              <Star className="mr-2 h-4 w-4 text-destructive" />
              <span className="text-destructive">Aus Favoriten entfernen</span>
            </>
          ) : (
            <>
              <Star className="mr-2 h-4 w-4 text-amber-500" />
              Zu Favoriten hinzufügen
            </>
          )}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => window.open(item.href, "_blank")}>
          <ExternalLink className="mr-2 h-4 w-4" />
          In neuem Tab öffnen
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
