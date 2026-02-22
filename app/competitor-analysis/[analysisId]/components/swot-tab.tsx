"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Target, AlertTriangle, Lightbulb, Shield } from "lucide-react"
import type { Opportunity, Threat } from "../types"
import { getPriorityColor } from "../types"

interface SwotTabProps {
  strengths?: string[]
  weaknesses?: string[]
  opportunities?: Opportunity[]
  threats?: Threat[]
}

export function SwotTab({ strengths = [], weaknesses = [], opportunities = [], threats = [] }: SwotTabProps) {
  return (
    <div className="space-y-6">
      {/* Strengths & Weaknesses Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="bg-green-50 dark:bg-green-950/20 rounded-t-lg pb-3">
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <TrendingUp className="h-5 w-5" />
              Marktstärken
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {strengths.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine Einträge</p>
            ) : (
              <ul className="space-y-2">
                {strengths.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5 shrink-0">{'\u2713'}</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="bg-red-50 dark:bg-red-950/20 rounded-t-lg pb-3">
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <TrendingDown className="h-5 w-5" />
              Marktschwächen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {weaknesses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine Einträge</p>
            ) : (
              <ul className="space-y-2">
                {weaknesses.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-red-500 mt-0.5 shrink-0">{'\u2717'}</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="bg-blue-50 dark:bg-blue-950/20 rounded-t-lg pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Lightbulb className="h-5 w-5" />
              Chancen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {opportunities.map((opp, i) => (
                <div key={i} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium">{opp.title}</h4>
                    {opp.priority && (
                      <Badge className={getPriorityColor(opp.priority)}>{opp.priority}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{opp.description}</p>
                  {opp.implementation_effort && (
                    <p className="text-xs text-muted-foreground mt-2">Aufwand: {opp.implementation_effort}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Threats */}
      {threats.length > 0 && (
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="bg-orange-50 dark:bg-orange-950/20 rounded-t-lg pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <Shield className="h-5 w-5" />
              Risiken
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {threats.map((threat, i) => (
                <div key={i} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium">{threat.title}</h4>
                    {threat.severity && (
                      <Badge className={getPriorityColor(threat.severity)}>{threat.severity}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{threat.description}</p>
                  {threat.mitigation && (
                    <p className="text-xs text-primary mt-2"><strong>Gegenmaßnahme:</strong> {threat.mitigation}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
