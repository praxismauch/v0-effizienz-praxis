"use client"
// cache-bust v53
import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import AppHeader from "@/components/app-header"
import { AppFooter } from "@/components/app-footer"
import { Skeleton } from "@/components/ui/skeleton"
import { OnboardingWizard } from "@/components/onboarding-wizard"

interface AppLayoutProps {
  children?: React.ReactNode
  loading?: boolean
  loadingMessage?: string
  showFooter?: boolean
  fullWidth?: boolean
  noPadding?: boolean
}

/**
 * Standardized app layout component for consistent page structure.
 * Uses AppSidebar, AppHeader (with Academy & Theme toggle), main content area with p-6, and AppFooter.
 *
 * NOTE: SidebarProvider is already in the root layout.tsx, so pages using this
 * component should NOT wrap themselves in another SidebarProvider.
 *
 * Footer is placed OUTSIDE the sidebar+main flex container to span full width.
 */
export function AppLayout({
  children,
  loading = false,
  loadingMessage = "Laden...",
  showFooter = true,
  fullWidth = false,
  noPadding = false,
}: AppLayoutProps) {
  if (loading) {
    return (
      <div
        className="flex flex-col min-h-screen w-full bg-background"
        style={{ "--footer-height": "44px" } as React.CSSProperties}
      >
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <AppHeader />
            <main className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-[400px]" />
                <p className="text-center text-muted-foreground">{loadingMessage}</p>
              </div>
            </main>
          </div>
        </div>
        {showFooter && <AppFooter />}
        <OnboardingWizard />
      </div>
    )
  }

  return (
    <div
      className="flex flex-col min-h-screen w-full bg-background"
      style={{ "--footer-height": showFooter ? "44px" : "0px" } as React.CSSProperties}
    >
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className={`flex-1 overflow-y-auto ${noPadding ? "" : "p-6"}`}>
            <div className={fullWidth ? "w-full" : "max-w-full"}>{children}</div>
          </main>
        </div>
      </div>
      {showFooter && <AppFooter />}
      <OnboardingWizard />
    </div>
  )
}

export default AppLayout
