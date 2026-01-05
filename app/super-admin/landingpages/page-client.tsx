"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutPanelLeft, Edit, FileText } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, lazy } from "react"
import { Skeleton } from "@/components/ui/skeleton"

const SuperAdminTemplatesManager = lazy(() =>
  import("@/components/super-admin-templates-manager").then((mod) => ({ default: mod.SuperAdminTemplatesManager })),
)

function LandingpagesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const activeTab = searchParams.get("tab") || "uebersicht"

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.push(`/super-admin/landingpages?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Landing Pages</h1>
        <p className="text-muted-foreground mt-2">Erstellen und verwalten Sie Landing Pages</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="uebersicht" className="gap-2">
            <LayoutPanelLeft className="h-4 w-4" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="editor" className="gap-2">
            <Edit className="h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="uebersicht" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Landing Page Übersicht</CardTitle>
              <CardDescription>Alle erstellten Landing Pages im System</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Hier werden alle Landing Pages angezeigt, die im System erstellt wurden.
                </p>
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <LayoutPanelLeft className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-sm text-muted-foreground">Noch keine Landing Pages vorhanden</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Erstellen Sie Ihre erste Landing Page im Editor-Tab
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editor" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Landing Page Editor</CardTitle>
              <CardDescription>Drag-and-Drop Editor für Landing Pages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Der visuelle Editor ermöglicht es Ihnen, Landing Pages per Drag & Drop zu erstellen.
                </p>
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <Edit className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    Editor wird in einer zukünftigen Version verfügbar sein
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nutzen Sie vorerst Templates für schnelles Erstellen
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <SuperAdminTemplatesManager />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function LandingpagesClient() {
  return (
    <Suspense fallback={<div>Lädt...</div>}>
      <LandingpagesContent />
    </Suspense>
  )
}
