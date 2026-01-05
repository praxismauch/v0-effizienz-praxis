"use client"

import { Suspense } from "react"
import { UserRightsManager } from "@/components/user-rights-manager"
import { SuperAdminLayout } from "@/components/super-admin-layout"

export const dynamic = "force-dynamic"

function UserRightsContent() {
  return <UserRightsManager />
}

export default function UserRightsPage() {
  return (
    <SuperAdminLayout initialTab="user-rights">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Lade Benutzerrechte...</p>
            </div>
          </div>
        }
      >
        <UserRightsContent />
      </Suspense>
    </SuperAdminLayout>
  )
}
