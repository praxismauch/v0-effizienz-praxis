"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Users } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"
import dynamic from "next/dynamic"
import { PageHeader } from "@/components/page-layout"

// Dynamic imports for code splitting
const PracticesManager = dynamic(() => import("@/components/super-admin/practices-manager"), {
  loading: () => <div className="animate-pulse h-96 bg-muted rounded-lg" />,
})

const UsersManager = dynamic(() => import("@/components/super-admin/users-manager"), {
  loading: () => <div className="animate-pulse h-96 bg-muted rounded-lg" />,
})

function VerwaltungContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get("tab") || "practices"
  // Redirect old tabs that have been moved elsewhere
  const activeTab = (tabParam === "permissions" || tabParam === "teams") ? "practices" : tabParam

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.push(`/super-admin/verwaltung?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verwaltung"
        subtitle="Verwalten Sie Praxen und Benutzer"
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="practices" className="gap-2">
            <Building2 className="h-4 w-4" />
            Praxen
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Benutzer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="practices" className="mt-6 space-y-4">
          <PracticesManager />
        </TabsContent>

        <TabsContent value="users" className="mt-6 space-y-4">
          <UsersManager />
        </TabsContent>
      </Tabs>
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
