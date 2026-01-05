"use client"

import { CompetitorAnalysisManagement } from "@/components/competitor-analysis/competitor-analysis-management"
import { AppLayout } from "@/components/app-layout"

export default function CompetitorAnalysisClientPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Konkurrenzanalyse</h1>
          <p className="text-muted-foreground mt-1">
            Analysieren Sie Ihre Wettbewerber und entdecken Sie Marktchancen mit KI-Unterstützung
          </p>
        </div>
        <CompetitorAnalysisManagement />
      </div>
    </AppLayout>
  )
}
