"use client"

import Link from "next/link"
import { Star, Map, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { SidebarHeader as UISidebarHeader } from "@/components/ui/sidebar"
import { PracticeSelector } from "@/components/practice-selector"

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
                  pathname === "/super-admin"
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-primary hover:text-sidebar-primary/80 hover:bg-sidebar-accent"
                )}
              >
                <Star className="h-4 w-4 fill-amber-500" />
                <span>Super Admin</span>
              </Link>
              <Link
                href="/super-admin/roadmap"
                className={cn(
                  "flex items-center gap-2 pl-8 pr-2 py-1.5 text-sm transition-colors rounded-md",
                  pathname === "/super-admin/roadmap"
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Map className="h-4 w-4" />
                <span>Roadmap & Ideen</span>
              </Link>
            </div>
          )}
          <PracticeSelector />
        </div>
      )}
    </>
  )
}
