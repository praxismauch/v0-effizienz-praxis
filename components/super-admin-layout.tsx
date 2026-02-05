"use client"

import type { ReactNode } from "react"
import { SuperAdminSidebarSimple } from "@/components/super-admin-sidebar-simple"
import { SuperAdminHeaderSimple } from "@/components/super-admin-header-simple"
import { AppFooter } from "@/components/app-footer"

interface SuperAdminLayoutProps {
  children: ReactNode
  user?: {
    email?: string
    full_name?: string
    avatar?: string
  }
  showFooter?: boolean
  fullWidth?: boolean
  noPadding?: boolean
}

/**
 * Super-admin layout matching the default AppLayout structure.
 * Uses flex-based layout with proper overflow handling.
 * Auth checks are handled in page-client components.
 */
export function SuperAdminLayout({ 
  children, 
  user,
  showFooter = true,
  fullWidth = false,
  noPadding = false
}: SuperAdminLayoutProps) {
  return (
    <div
      className="flex flex-col min-h-screen w-full bg-background"
      style={{ "--footer-height": showFooter ? "44px" : "0px" } as React.CSSProperties}
    >
      <div className="flex flex-1 overflow-hidden">
        <SuperAdminSidebarSimple />
        <div className="flex flex-1 flex-col overflow-hidden">
          <SuperAdminHeaderSimple user={user} />
          <main className={`flex-1 overflow-y-auto ${noPadding ? "" : "p-6"}`}>
            <div className={fullWidth ? "w-full" : "max-w-full"}>{children}</div>
          </main>
        </div>
      </div>
      {showFooter && <AppFooter />}
    </div>
  )
}

export default SuperAdminLayout
