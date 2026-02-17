"use client"

import { memo } from "react"
import { Eye, Users, Building2, UserPlus, Zap, DollarSign, Clock, Target } from "lucide-react"
import { StatCard, statCardColors } from "@/components/ui/stat-card"

interface AnalyticsStatCardsProps {
  systemMetrics: {
    totalPractices?: number
    newPractices?: number
    activeUsers?: number
    userGrowthPercent?: number
    totalFeatureUsage?: number
    avgFeatureUsagePerUser?: number
    conversionRate?: number
    avgSessionDuration?: string
    waitlistCount?: number
  } | null
  subscriptionStats: {
    mrr?: number
    activeSubscriptions?: number
  } | null
  totalViews: number
  dateRange: string
}

export const AnalyticsStatCards = memo(function AnalyticsStatCards({
  systemMetrics,
  subscriptionStats,
  totalViews,
  dateRange,
}: AnalyticsStatCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Aktive Praxen"
        value={systemMetrics?.totalPractices || 0}
        icon={Building2}
        {...statCardColors.primary}
        description={`+${systemMetrics?.newPractices || 0} in den letzten ${dateRange} Tagen`}
      />
      <StatCard
        label="Aktive Benutzer"
        value={systemMetrics?.activeUsers || 0}
        icon={Users}
        {...statCardColors.blue}
        description={`${systemMetrics?.userGrowthPercent || 0}% Wachstum`}
      />
      <StatCard
        label="Feature-Nutzung"
        value={systemMetrics?.totalFeatureUsage || 0}
        icon={Zap}
        {...statCardColors.amber}
        description={`\u00D8 ${systemMetrics?.avgFeatureUsagePerUser || 0} pro Benutzer`}
      />
      <StatCard
        label="MRR (Monatlich)"
        value={subscriptionStats?.mrr ? `\u20AC${(subscriptionStats.mrr / 100).toLocaleString()}` : "\u20AC0"}
        icon={DollarSign}
        {...statCardColors.green}
        description={`${subscriptionStats?.activeSubscriptions || 0} aktive Abos`}
      />
      <StatCard
        label="Seitenaufrufe"
        value={totalViews.toLocaleString()}
        icon={Eye}
        {...statCardColors.purple}
        description="Landing Page Traffic"
      />
      <StatCard
        label="Conversion Rate"
        value={systemMetrics?.conversionRate ? `${systemMetrics.conversionRate.toFixed(1)}%` : "0%"}
        icon={Target}
        {...statCardColors.orange}
        description="Besucher zu Registrierungen"
      />
      <StatCard
        label="Ø Session-Dauer"
        value={systemMetrics?.avgSessionDuration || "0m"}
        icon={Clock}
        {...statCardColors.info}
        description="Pro Benutzer pro Tag"
      />
      <StatCard
        label="Warteschlange"
        value={systemMetrics?.waitlistCount || 0}
        icon={UserPlus}
        {...statCardColors.red}
        description="Wartende Interessenten"
      />
    </div>
  )
})
