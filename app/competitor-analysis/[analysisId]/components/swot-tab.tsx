"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Target, AlertTriangle } from "lucide-react"
import type { CompetitorAnalysis } from "../types"

interface SwotTabProps {
  analysis: CompetitorAnalysis
}

export function SwotTab({ analysis }: SwotTabProps) {
  const swot = analysis.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] }

  const sections = [
    {
      title: "Stärken",
      items: swot.strengths || [],
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-l-green-500",
    },
    {
      title: "Schwächen",
      items: swot.weaknesses || [],
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950/20",
      borderColor: "border-l-red-500",
    },
    {
      title: "Chancen",
      items: swot.opportunities || [],
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-l-blue-500",
    },
    {
      title: "Risiken",
      items: swot.threats || [],
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      borderColor: "border-l-orange-500",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sections.map((section) => (
        <Card key={section.title} className={`border-l-4 ${section.borderColor}`}>
          <CardHeader className={`${section.bgColor} rounded-t-lg`}>
            <CardTitle className={`flex items-center gap-2 ${section.color}`}>
              <section.icon className="h-5 w-5" />
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {section.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine Einträge</p>
            ) : (
              <ul className="space-y-2">
                {section.items.map((item: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${section.color.replace("text-", "bg-")}`} />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
