"use client"

import { Suspense } from "react"
import { PageHeader } from "@/components/page-layout"
import { Users } from "lucide-react"
import dynamic from "next/dynamic"

const UsersManager = dynamic(() => import("@/components/super-admin/users-manager"), {
  loading: () => <div className="animate-pulse h-96 bg-muted rounded-lg" />,
})

export default function SuperAdminUsers() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Benutzerverwaltung"
        subtitle="Verwalten Sie alle Systembenutzer, Rollen und Zugriffsrechte"
        icon={Users}
      />

      <Suspense fallback={<div className="animate-pulse h-96 bg-muted rounded-lg" />}>
        <UsersManager />
      </Suspense>
    </div>
  )
}
