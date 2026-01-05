"use client"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"
import dynamic from "next/dynamic"

const SuperAdminAcademyManager = dynamic(() => import("@/components/super-admin-academy-manager"), {
  loading: () => <div className="flex items-center justify-center h-96">Lädt Academy Manager...</div>,
})

function AcademyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") || "overview"

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.push(`/super-admin/academy?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Academy Verwaltung</h1>
        <p className="text-muted-foreground mt-2">Verwalten Sie Kurse, Module, Lektionen und Badges</p>
      </div>

      <SuperAdminAcademyManager />
    </div>
  )
}

export default function AcademyClient() {
  return (
    <Suspense fallback={<div>Lädt...</div>}>
      <AcademyContent />
    </Suspense>
  )
}
