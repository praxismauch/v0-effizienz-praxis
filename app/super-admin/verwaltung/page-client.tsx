"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useEffect } from "react"
import dynamic from "next/dynamic"
import { PageHeader } from "@/components/page-layout"

const PracticesManager = dynamic(() => import("@/components/super-admin/practices-manager"), {
  loading: () => <div className="animate-pulse h-96 bg-muted rounded-lg" />,
})

function VerwaltungContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Redirect old tab URLs to their new dedicated pages
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "users") {
      router.replace("/super-admin/users")
    } else if (tab === "teams") {
      router.replace("/super-admin/content?tab=teams")
    } else if (tab === "permissions") {
      router.replace("/super-admin/user-rights?tab=matrix")
    }
  }, [searchParams, router])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Praxenverwaltung"
        subtitle="Verwalten Sie alle Praxen im System"
      />

      <PracticesManager />
    </div>
  )
}

export default function VerwaltungClient() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 bg-muted rounded-lg" />}>
      <VerwaltungContent />
    </Suspense>
  )
}
