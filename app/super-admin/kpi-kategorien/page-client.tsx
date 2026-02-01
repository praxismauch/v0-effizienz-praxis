"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, FolderOpen, Database, Info, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const GlobalParameterManagement = dynamic(
  () => import("@/components/global-parameter-management"),
  {
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Lädt KPI-Verwaltung...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
)

function KpiKategorienContent() {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KPI-Kategorien</h1>
          <p className="text-muted-foreground mt-2">
            Verwalten Sie globale Kennzahlen (KPIs) und Kategorien, die allen Praxen zur Verfügung stehen
          </p>
        </div>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Globale KPI-Verwaltung</AlertTitle>
        <AlertDescription>
          Hier definierte KPIs und Kategorien dienen als Vorlagen für alle Praxen im System. Praxen können diese
          Vorlagen übernehmen und nach Bedarf anpassen. Änderungen an globalen KPIs wirken sich nicht automatisch auf
          bereits importierte Praxis-KPIs aus.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KPI-Kategorien</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Organisieren Sie Kennzahlen in thematische Gruppen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Globale KPIs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Definieren Sie standardisierte Kennzahlen für alle Praxen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datenerfassung</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Verwalten Sie Erfassungsintervalle und Werte
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="management" className="space-y-4">
        <TabsList>
          <TabsTrigger value="management" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            KPI-Verwaltung
          </TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Globale Kennzahlen & Kategorien
              </CardTitle>
              <CardDescription>
                Erstellen und verwalten Sie KPI-Kategorien und die dazugehörigen Kennzahlen. Diese Vorlagen können von
                Praxen importiert und verwendet werden.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 md:p-6">
              <GlobalParameterManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function KpiKategorienClient() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
            <p className="mt-4 text-sm text-muted-foreground">Lade KPI-Kategorien...</p>
          </div>
        </div>
      }
    >
      <KpiKategorienContent />
    </Suspense>
  )
}
