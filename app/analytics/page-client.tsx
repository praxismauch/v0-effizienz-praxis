"use client"

import PageHeader from "@/components/page-header"
import CustomizableAnalytics from "@/components/customizable-analytics"
import ReportsGenerator from "@/components/reports-generator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, FileText, Receipt, Building2, Table2, BarChart3, Layout, Star, PieChart } from "lucide-react"
import ExcelUploadAnalyzer from "@/components/excel-upload-analyzer"
import AnalyticsDataManager from "@/components/analytics-data-manager"
import { usePersistedTab } from "@/hooks/use-persisted-tab"
import { useTranslation } from "@/contexts/translation-context"
import AIAnalyticsInsightsDialog from "@/components/ai-analytics-insights-dialog"
import { KVAbrechnungUnified } from "@/components/kv-abrechnung-unified"
import { BankAccountManager } from "@/components/bank-account-manager"
import ReviewsManager from "@/components/reviews-manager"
import { DiagrammeTab } from "@/components/analytics/diagramme-tab"
import { useUser } from "@/contexts/user-context"

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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 h-auto gap-1">
            <TabsTrigger
              value="analytics"
              className="gap-2 hover:bg-muted/80 hover:border-2 hover:border-foreground/20 transition-all duration-200"
            >
              <TrendingUp className="h-4 w-4" />
              {t("analytics.tabs.analytics", "Auswertung")}
            </TabsTrigger>
            <TabsTrigger
              value="data"
              className="gap-2 hover:bg-muted/80 hover:border-2 hover:border-foreground/20 transition-all duration-200"
            >
              <BarChart3 className="h-4 w-4" />
              {t("analytics.tabs.data", "Kennzahlen")}
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="gap-2 hover:bg-muted/80 hover:border-2 hover:border-foreground/20 transition-all duration-200"
            >
              <Star className="h-4 w-4" />
              {t("analytics.tabs.reviews", "Bewertungen")}
            </TabsTrigger>
            <TabsTrigger
              value="kv-abrechnung"
              className="gap-2 hover:bg-muted/80 hover:border-2 hover:border-foreground/20 transition-all duration-200"
            >
              <Receipt className="h-4 w-4" />
              {t("analytics.tabs.kv", "KV-Abrechnung")}
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="gap-2 hover:bg-muted/80 hover:border-2 hover:border-foreground/20 transition-all duration-200"
            >
              <FileText className="h-4 w-4" />
              {t("analytics.tabs.reports", "Berichte")}
            </TabsTrigger>
            <TabsTrigger
              value="bank"
              className="gap-2 hover:bg-muted/80 hover:border-2 hover:border-foreground/20 transition-all duration-200"
            >
              <Building2 className="h-4 w-4" />
              {t("analytics.tabs.bank", "Bankkonten")}
            </TabsTrigger>
            <TabsTrigger
              value="excel"
              className="gap-2 hover:bg-muted/80 hover:border-2 hover:border-foreground/20 transition-all duration-200"
            >
              <Table2 className="h-4 w-4" />
              {t("analytics.tabs.excel", "Excel")}
            </TabsTrigger>
            <TabsTrigger
              value="widgets"
              className="gap-2 hover:bg-muted/80 hover:border-2 hover:border-foreground/20 transition-all duration-200"
            >
              <Layout className="h-4 w-4" />
              {t("analytics.tabs.widgets", "Widgets")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-4">
            <CustomizableAnalytics />
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <AnalyticsDataManager />
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            {currentUser?.practiceId ? (
              <ReviewsManager practiceId={currentUser.practiceId.toString()} />
            ) : (
              <ReviewsManager />
            )}
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

          <TabsContent value="widgets" className="space-y-4">
            <DiagrammeTab />
          </TabsContent>

        </Tabs>
      </div>
    </>
  )
}
