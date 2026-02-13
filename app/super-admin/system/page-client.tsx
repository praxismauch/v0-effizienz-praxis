"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { Settings, Key } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

const SystemSettingsTabs = dynamic(() => import("@/components/system-settings-tabs"), {
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
  ssr: false,
})

const ApiKeysManager = dynamic(() => import("@/components/super-admin/api-keys-manager"), {
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
  ssr: false,
})

function SystemContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") || "einstellungen"

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.push(`/super-admin/system?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Systemverwaltung</h1>
        <p className="text-muted-foreground mt-2">Verwalten Sie System-Einstellungen und APIs</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="einstellungen" className="gap-2">
            <Settings className="h-4 w-4" />
            Einstellungen
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2">
            <Key className="h-4 w-4" />
            API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="einstellungen" className="mt-6 space-y-4">
          <SystemSettingsTabs />
        </TabsContent>

        <TabsContent value="api" className="mt-6 space-y-4">
          <ApiKeysManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function SystemClient() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <SystemContent />
    </Suspense>
  )
}
