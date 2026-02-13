"use client"

import { Card, CardContent } from "@/components/ui/card"
import { FileText, Bell, MessageSquare, TrendingUp } from "lucide-react"

interface SurveyStatsCardsProps {
  stats: {
    total: number
    active: number
    totalResponses: number
    avgResponseRate: number
  }
}

export function SurveyStatsCards({ stats }: SurveyStatsCardsProps) {
  const cards = [
    {
      label: "Gesamt",
      value: stats.total,
      icon: FileText,
      gradient: "from-violet-50 to-purple-50",
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
      valueColor: "text-violet-700",
    },
    {
      label: "Aktiv",
      value: stats.active,
      icon: Bell,
      gradient: "from-emerald-50 to-green-50",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      valueColor: "text-emerald-700",
    },
    {
      label: "Antworten",
      value: stats.totalResponses,
      icon: MessageSquare,
      gradient: "from-blue-50 to-cyan-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      valueColor: "text-blue-700",
    },
    {
      label: "Ø Antworten",
      value: stats.avgResponseRate,
      icon: TrendingUp,
      gradient: "from-amber-50 to-orange-50",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      valueColor: "text-amber-700",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      {cards.map((card) => (
        <Card key={card.label} className={`border-0 shadow-sm bg-gradient-to-br ${card.gradient}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.iconBg}`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
