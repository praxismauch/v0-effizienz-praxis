"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Database, Activity, Key, AlertTriangle } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"
import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

const BackupManager = dynamic(() => import("@/components/backup-manager").then((mod) => ({ default: mod.BackupManager })), {
  loading: () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
  ssr: false,
})

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
        <p className="text-muted-foreground mt-2">Verwalten Sie System-Einstellungen, Backup, Logs und APIs</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="einstellungen" className="gap-2">
            <Settings className="h-4 w-4" />
            Einstellungen
          </TabsTrigger>
          <TabsTrigger value="backup" className="gap-2">
            <Database className="h-4 w-4" />
            Backup
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <Activity className="h-4 w-4" />
            Logs
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2">
            <Key className="h-4 w-4" />
            API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="einstellungen" className="mt-6 space-y-4">
          <SystemSettingsTabs />
        </TabsContent>

        <TabsContent value="backup" className="mt-6 space-y-4">
          <BackupManager userId="super-admin" practices={[]} />
        </TabsContent>

        <TabsContent value="logs" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Error Logging
              </CardTitle>
              <CardDescription>
                Die vollstaendige Fehlerverwaltung mit Filtern, Statistiken und Status-Management finden Sie im dedizierten Error Logging Bereich.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/super-admin/logging">
                <Button className="gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Error Logging oeffnen
                </Button>
              </Link>
            </CardContent>
          </Card>
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
