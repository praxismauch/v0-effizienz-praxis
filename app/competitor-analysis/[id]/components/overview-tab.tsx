"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"
import type { CompetitorAnalysis } from "../types"

interface OverviewTabProps {
  analysis: CompetitorAnalysis
}

export function OverviewTab({ analysis }: OverviewTabProps) {
  return (
    <div className="space-y-4">
      {analysis.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Zusammenfassung</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{analysis.summary}</p>
          </CardContent>
        </Card>
      )}

      {analysis.market_overview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Marktübersicht
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.market_overview.total_competitors && (
              <div>
                <div className="text-sm font-medium mb-1">Anzahl Wettbewerber</div>
                <div className="text-2xl font-bold">{analysis.market_overview.total_competitors}</div>
              </div>
            )}
            {analysis.market_overview.market_saturation && (
              <div>
                <div className="text-sm font-medium mb-1">Marktsättigung</div>
                <div className="text-lg">{analysis.market_overview.market_saturation}</div>
              </div>
            )}
            {analysis.market_overview.key_insights && (
              <div>
                <div className="text-sm font-medium mb-2">Wichtige Erkenntnisse</div>
                <ul className="space-y-1">
                  {analysis.market_overview.key_insights.map((insight: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      • {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
