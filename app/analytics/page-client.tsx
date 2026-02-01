"use client"

import PageHeader from "@/components/page-header"
import CustomizableAnalytics from "@/components/customizable-analytics"
import ReportsGenerator from "@/components/reports-generator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, FileText, Receipt, Building2, Table2, BarChart3, Layout } from "lucide-react"
import ExcelUploadAnalyzer from "@/components/excel-upload-analyzer"
import AnalyticsDataManager from "@/components/analytics-data-manager"
import { usePersistedTab } from "@/hooks/use-persisted-tab"
import { useTranslation } from "@/contexts/translation-context"
import AIAnalyticsInsightsDialog from "@/components/ai-analytics-insights-dialog"
import { KVAbrechnungUnified } from "@/components/kv-abrechnung-unified"
import { BankAccountManager } from "@/components/bank-account-manager"
import { useUser } from "@/contexts/user-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp as TrendingUpIcon, AlertCircle } from "lucide-react"

export default function AnalyticsPageClient() {
  const [activeTab, setActiveTab] = usePersistedTab("analytics-page", "analytics")
  const { t } = useTranslation()
  const { currentUser } = useUser()

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <PageHeader
          title={t("analytics.title", "Practice Analytics")}
          subtitle={t("analytics.subtitle", "Comprehensive insights into your practice performance and care metrics")}
        />
        <AIAnalyticsInsightsDialog />
      </div>
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 h-auto gap-1">
            <TabsTrigger
              value="analytics"
              className="gap-2 hover:bg-muted/80 hover:border-2 hover:border-foreground/20 transition-all duration-200"
            >
              <Layout className="h-4 w-4" />
              {t("analytics.tabs.analytics", "Diagramme")}
            </TabsTrigger>
            <TabsTrigger
              value="data"
              className="gap-2 hover:bg-muted/80 hover:border-2 hover:border-foreground/20 transition-all duration-200"
            >
              <BarChart3 className="h-4 w-4" />
              {t("analytics.tabs.data", "Kennzahlen")}
            </TabsTrigger>
            <TabsTrigger
              value="excel"
              className="gap-2 hover:bg-muted/80 hover:border-2 hover:border-foreground/20 transition-all duration-200"
            >
              <Table2 className="h-4 w-4" />
              {t("analytics.tabs.excel", "Dateien")}
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="gap-2 hover:bg-muted/80 hover:border-2 hover:border-foreground/20 transition-all duration-200"
            >
              <FileText className="h-4 w-4" />
              {t("analytics.tabs.reports", "Bericht")}
            </TabsTrigger>
            <TabsTrigger
              value="trends"
              className="gap-2 hover:bg-muted/80 hover:border-2 hover:border-foreground/20 transition-all duration-200"
            >
              <TrendingUp className="h-4 w-4" />
              {t("analytics.tabs.trends", "Trends")}
            </TabsTrigger>
            <TabsTrigger
              value="kv-abrechnung"
              className="gap-2 hover:bg-muted/80 hover:border-2 hover:border-foreground/20 transition-all duration-200"
            >
              <Receipt className="h-4 w-4" />
              {t("analytics.tabs.kv", "KV-Abrechnung")}
            </TabsTrigger>
            <TabsTrigger
              value="bank"
              className="gap-2 hover:bg-muted/80 hover:border-2 hover:border-foreground/20 transition-all duration-200"
            >
              <Building2 className="h-4 w-4" />
              {t("analytics.tabs.bank", "Finanzen")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            <CustomizableAnalytics />
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <AnalyticsDataManager />
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUpIcon className="h-5 w-5 text-primary" />
                  Trend-Analyse
                </CardTitle>
                <CardDescription>
                  Langfristige Entwicklungen und Prognosen für Ihre Praxis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 rounded-full bg-primary/10 mb-4">
                    <TrendingUpIcon className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Trend-Analyse kommt bald</h3>
                  <p className="text-muted-foreground max-w-md">
                    Die Trend-Analyse wird automatisch Muster in Ihren Kennzahlen erkennen und 
                    Ihnen helfen, zukünftige Entwicklungen vorherzusagen.
                  </p>
                  <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    Verfügbar sobald genügend historische Daten vorliegen
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kv-abrechnung" className="space-y-4">
            <KVAbrechnungUnified />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <ReportsGenerator />
          </TabsContent>

          <TabsContent value="bank" className="space-y-4">
            {currentUser?.practiceId && <BankAccountManager practiceId={currentUser.practiceId} />}
            {!currentUser?.practiceId && (
              <div className="text-center text-muted-foreground py-8">
                Keine Praxis-ID verfügbar. Bitte stellen Sie sicher, dass Sie einer Praxis zugeordnet sind.
              </div>
            )}
          </TabsContent>

          <TabsContent value="excel" className="space-y-4">
            <ExcelUploadAnalyzer />
          </TabsContent>


        </Tabs>
      </div>
    </>
  )
}
