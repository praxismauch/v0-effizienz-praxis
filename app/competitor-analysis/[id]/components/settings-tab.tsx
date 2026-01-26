"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Trash2, RefreshCw, Calendar, AlertTriangle } from "lucide-react"
import type { CompetitorAnalysis } from "../types"

interface SettingsTabProps {
  analysis: CompetitorAnalysis
  onDelete: () => void
  onRefreshAnalysis: () => void
  isRefreshing?: boolean
}

export function SettingsTab({ analysis, onDelete, onRefreshAnalysis, isRefreshing }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      {/* Analysis Info */}
      <Card>
        <CardHeader>
          <CardTitle>Analyse-Informationen</CardTitle>
          <CardDescription>Details zu dieser Wettbewerbsanalyse</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Erstellt am</Label>
              <p className="font-medium">
                {analysis.created_at ? new Date(analysis.created_at).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }) : "Unbekannt"}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Zuletzt aktualisiert</Label>
              <p className="font-medium">
                {analysis.updated_at ? new Date(analysis.updated_at).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }) : "Unbekannt"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aktionen</CardTitle>
          <CardDescription>Analyse aktualisieren oder löschen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              onClick={onRefreshAnalysis}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Analyse aktualisieren
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Gefahrenzone
          </CardTitle>
          <CardDescription>Unwiderrufliche Aktionen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <div>
              <p className="font-medium">Analyse löschen</p>
              <p className="text-sm text-muted-foreground">
                Diese Aktion kann nicht rückgängig gemacht werden
              </p>
            </div>
            <Button variant="destructive" onClick={onDelete} className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Löschen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
