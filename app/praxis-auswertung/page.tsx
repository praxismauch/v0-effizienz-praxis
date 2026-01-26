"use client"

import { AppLayout } from "@/components/app-layout"
import PageHeader from "@/components/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, BarChart3, TrendingUp } from "lucide-react"
import KVAbrechnungManager from "@/components/kv-abrechnung-manager"
import KVAbrechnungBericht from "@/components/kv-abrechnung-bericht"
import { usePersistedTab } from "@/hooks/use-persisted-tab"

export const dynamic = "force-dynamic"

export default function PraxisAuswertungPage() {
  const [activeTab, setActiveTab] = usePersistedTab("praxis-auswertung-page", "dateien")

  return (
    <AppLayout>
      <PageHeader title="Kennzahlen" subtitle="Umfassende Einblicke in Ihre Praxisleistung und Versorgungskennzahlen" />

      <div className="mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto gap-1">
            <TabsTrigger value="dateien" className="gap-2">
              <FileText className="h-4 w-4" />
              Dateien
            </TabsTrigger>
            <TabsTrigger value="bericht" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Bericht
            </TabsTrigger>
            <TabsTrigger value="trends" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dateien">
            <KVAbrechnungManager />
          </TabsContent>

          <TabsContent value="bericht">
            <KVAbrechnungBericht />
          </TabsContent>

          <TabsContent value="trends">
            <div className="text-center py-12 text-muted-foreground">Trend-Analyse wird in Kürze verfügbar sein</div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
