"use client"

import { SuperAdminAcademyManager } from "@/components/super-admin-academy-manager"
import { SuperAdminLayout } from "@/components/super-admin-layout"

export default function SuperAdminAcademyPage() {
  return (
    <SuperAdminLayout initialTab="academy">
      <SuperAdminAcademyManager />
    </SuperAdminLayout>
  )
}
