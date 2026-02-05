"use client"

import type { ReactNode } from "react"
import { SuperAdminSidebarSimple } from "@/components/super-admin-sidebar-simple"
import { SuperAdminHeaderSimple } from "@/components/super-admin-header-simple"
import { SuperAdminSidebarProvider, useSuperAdminSidebar } from "@/contexts/super-admin-sidebar-context"

interface SuperAdminLayoutProps {
  children: ReactNode
  user?: {
    email?: string
    full_name?: string
    avatar?: string
  }
}

function SuperAdminLayoutContent({ children, user }: SuperAdminLayoutProps) {
  const { sidebarWidth } = useSuperAdminSidebar()

  return (
    <div className="min-h-screen bg-background">
      {/* Simplified Sidebar */}
      <SuperAdminSidebarSimple />

      {/* Main content area with header */}
      <div
        className="transition-all duration-300"
        style={{ paddingLeft: `${sidebarWidth}px` }}
      >
        {/* Simplified Header */}
        <SuperAdminHeaderSimple user={user} />

        {/* Content - with top padding for fixed header */}
        <main className="pt-16">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}

/**
 * Simplified super-admin layout with clean sidebar and header.
 * Auth checks are handled in page-client components.
 */
export function SuperAdminLayout({ children, user }: SuperAdminLayoutProps) {
  return (
    <SuperAdminSidebarProvider>
      <SuperAdminLayoutContent user={user}>{children}</SuperAdminLayoutContent>
    </SuperAdminSidebarProvider>
  )
}

export default SuperAdminLayout
