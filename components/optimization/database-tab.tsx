import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, TrendingUp } from "lucide-react"
import type { OptimizationMetrics } from "./types"

interface DatabaseTabProps {
  database: OptimizationMetrics["database"]
}

export function DatabaseTab({ database }: DatabaseTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Datenbank Metriken</CardTitle>
          <CardDescription>Übersicht über Ihre Datenbankressourcen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Gesamttabellen</span>
              <span className="text-2xl font-bold">{database.totalTables}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Tabellen mit RLS</span>
              <span className="text-2xl font-bold">{database.tablesWithRLS}</span>
            </div>
            <Progress value={(database.tablesWithRLS / database.totalTables) * 100} />
          </div>

          {database.tablesWithoutRLS.length > 0 && (
            <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-orange-900 mb-2">Warnung: Tabellen ohne RLS</h4>
                  <p className="text-sm text-orange-800 mb-2">
                    {database.tablesWithoutRLS.length} Tabelle(n) haben Row Level Security nicht aktiviert.
                    Dies stellt ein Sicherheitsrisiko dar.
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {database.tablesWithoutRLS.map((table) => (
                      <li key={table} className="text-sm text-orange-800">{table}</li>
                    ))}
                  </ul>
                  <Button size="sm" className="mt-3 bg-transparent" variant="outline">
                    SQL Script ausführen
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Index Coverage</span>
              <span className="text-2xl font-bold">{database.indexCoverage}%</span>
            </div>
            <Progress value={database.indexCoverage} />
          </div>

          {database.potentialIndexes.length > 0 && (
            <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-2">Empfohlene Indexe</h4>
                  <p className="text-sm text-blue-800 mb-2">
                    Diese Indexe könnten die Query-Performance verbessern:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {database.potentialIndexes.map((index, i) => (
                      <li key={i} className="text-sm text-blue-800 font-mono">{index}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
