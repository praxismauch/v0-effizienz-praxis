"use client"

import Link from "next/link"
import { ChevronRight, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { SidebarHeader as UISidebarHeader } from "@/components/ui/sidebar"
import { PracticeSelector } from "@/components/practice-selector"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface AppSidebarHeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  isSuperAdmin: boolean
  pathname: string
}

export function AppSidebarHeader({
  sidebarOpen,
  setSidebarOpen,
  isSuperAdmin,
  pathname,
}: AppSidebarHeaderProps) {
  return (
    <>
      <UISidebarHeader>
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border/40 shrink-0",
            !sidebarOpen ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          {sidebarOpen && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <Logo className="h-8 w-8 rounded-lg" />
              <span className="text-base font-bold text-sidebar-foreground">
                Effizienz Praxis
              </span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "text-sidebar-foreground hover:bg-sidebar-accent",
              !sidebarOpen ? "h-10 w-10" : "h-8 w-8 p-0"
            )}
          >
            {!sidebarOpen ? (
              <Logo className="h-8 w-8 rounded-lg" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
        </div>
      </UISidebarHeader>

      {sidebarOpen && (
        <div className="px-3 py-2 border-b border-sidebar-border/30 shrink-0">
          {isSuperAdmin && (
            <div className="space-y-0.5 mb-2">
              <Link
                href="/super-admin"
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 text-sm font-medium transition-colors rounded-md",
                  pathname === "/super-admin" || pathname.startsWith("/super-admin/")
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-primary hover:text-sidebar-primary/80 hover:bg-sidebar-accent"
                )}
              >
                <span>Super Admin</span>
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Link>
            </div>
          )}
          <PracticeSelector />
        </div>
      )}

      {/* Collapsed state: show Management icon with tooltip */}
      {!sidebarOpen && isSuperAdmin && (
        <div className="px-2 py-2 border-b border-sidebar-border/30">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/super-admin"
                className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-md transition-colors",
                  pathname === "/super-admin" || pathname.startsWith("/super-admin/")
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-primary hover:text-sidebar-primary/80 hover:bg-sidebar-accent"
                )}
              >
                <Settings className="h-5 w-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <span>Super Admin</span>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </>
  )
}
