"use client"

import type { ReactNode } from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import dynamic from "next/dynamic"

const SuperAdminSidebar = dynamic(
  () => import("@/components/super-admin-sidebar").then((mod) => ({ default: mod.SuperAdminSidebar })),
  { ssr: false }
)

const SuperAdminHeader = dynamic(
  () => import("@/components/super-admin-header").then((mod) => ({ default: mod.SuperAdminHeader })),
  { ssr: false }
)

interface SuperAdminLayoutProps {
  children: ReactNode
}

/**
 * Simple presentational layout for super-admin pages.
 * Auth checks are handled in page-client components.
 */
export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        {/* Sidebar - fixed width */}
        <SuperAdminSidebar />

        {/* Main content area - takes remaining width */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header - full width of content area */}
          <SuperAdminHeader />

          {/* Content - scrollable, full width with consistent padding */}
          <main className="flex-1 overflow-y-auto">
            <div className="w-full min-h-full flex flex-col">
              <div className="flex-1 px-6 py-6">{children}</div>
              <footer className="px-6 py-4 border-t bg-muted/30 text-center text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Praxis Effizienz. Alle Rechte vorbehalten.</p>
              </footer>
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default SuperAdminLayout
