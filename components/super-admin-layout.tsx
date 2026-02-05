"use client"

import type { ReactNode } from "react"
import { SuperAdminSidebarSimple } from "@/components/super-admin-sidebar-simple"
import { SuperAdminHeaderSimple } from "@/components/super-admin-header-simple"

interface SuperAdminLayoutProps {
  children: ReactNode
  user?: {
    email?: string
    full_name?: string
    avatar?: string
  }
}

/**
 * Simplified super-admin layout with clean sidebar and header.
 * Auth checks are handled in page-client components.
 */
export function SuperAdminLayout({ children, user }: SuperAdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Simplified Sidebar - fixed positioning */}
      <SuperAdminSidebarSimple />

      {/* Main content area - fixed left padding for sidebar */}
      <div className="pl-64">
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

export default SuperAdminLayout
