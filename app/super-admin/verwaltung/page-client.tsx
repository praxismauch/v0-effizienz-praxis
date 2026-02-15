"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Users, Shield, UsersRound } from "lucide-react"
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

const TeamsManager = dynamic(() => import("@/components/super-admin/teams-manager"), {
  loading: () => <div className="animate-pulse h-96 bg-muted rounded-lg" />,
})

const PermissionsManager = dynamic(() => import("@/components/super-admin/permissions-manager"), {
  loading: () => <div className="animate-pulse h-96 bg-muted rounded-lg" />,
})

function VerwaltungContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") || "practices"

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.push(`/super-admin/verwaltung?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verwaltung"
        subtitle="Verwalten Sie Praxen, Benutzer, Teams und Berechtigungen"
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="practices" className="gap-2">
            <Building2 className="h-4 w-4" />
            Praxen
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Benutzer
          </TabsTrigger>
          <TabsTrigger value="teams" className="gap-2">
            <UsersRound className="h-4 w-4" />
            Teams
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Shield className="h-4 w-4" />
            Berechtigungen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="practices" className="mt-6 space-y-4">
          <PracticesManager />
        </TabsContent>

        <TabsContent value="users" className="mt-6 space-y-4">
          <UsersManager />
        </TabsContent>

        <TabsContent value="teams" className="mt-6 space-y-4">
          <TeamsManager />
        </TabsContent>

        <TabsContent value="permissions" className="mt-6 space-y-4">
          <PermissionsManager />
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
