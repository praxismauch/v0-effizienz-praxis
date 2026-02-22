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
            {analysis.market_overview.total_competitors != null && (
              <div>
                <div className="text-sm font-medium mb-1">Anzahl Wettbewerber</div>
                <div className="text-2xl font-bold">{analysis.market_overview.total_competitors}</div>
              </div>
            )}
            {(analysis.market_overview as Record<string, unknown>).market_size && (
              <div>
                <div className="text-sm font-medium mb-1">Marktgröße</div>
                <p className="text-sm text-muted-foreground">{(analysis.market_overview as Record<string, unknown>).market_size as string}</p>
              </div>
            )}
            {(analysis.market_overview as Record<string, unknown>).demographics && (
              <div>
                <div className="text-sm font-medium mb-1">Demografie</div>
                <p className="text-sm text-muted-foreground">{(analysis.market_overview as Record<string, unknown>).demographics as string}</p>
              </div>
            )}
            {analysis.market_overview.market_saturation && (
              <div>
                <div className="text-sm font-medium mb-1">Marktsättigung</div>
                <div className="text-lg">{analysis.market_overview.market_saturation}</div>
              </div>
            )}
            {(analysis.market_overview as Record<string, unknown>).growth_potential && (
              <div>
                <div className="text-sm font-medium mb-1">Wachstumspotenzial</div>
                <p className="text-sm text-muted-foreground">{(analysis.market_overview as Record<string, unknown>).growth_potential as string}</p>
              </div>
            )}
            {((analysis.market_overview as Record<string, unknown>).trends as string[])?.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Markttrends</div>
                <ul className="space-y-1">
                  {((analysis.market_overview as Record<string, unknown>).trends as string[]).map((trend: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      {trend}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.market_overview.key_insights && (
              <div>
                <div className="text-sm font-medium mb-2">Wichtige Erkenntnisse</div>
                <ul className="space-y-1">
                  {analysis.market_overview.key_insights.map((insight: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      {insight}
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
