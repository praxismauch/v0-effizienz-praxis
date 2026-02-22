"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Euro,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Percent,
} from "lucide-react"

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "---"
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value)
}

interface BWADataTabProps {
  ext: any
  monthLabel: string
  year: number
}

export function BWADataTab({ ext, monthLabel, year }: BWADataTabProps) {
  if (!ext) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <BarChart3 className="h-14 w-14 mx-auto mb-4 text-muted-foreground opacity-40" />
          <p className="text-lg font-medium text-muted-foreground">Noch keine BWA-Daten vorhanden</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Laden Sie eine BWA-Datei hoch und starten Sie die KI-Analyse, um die extrahierten
            Finanzdaten hier zu sehen.
          </p>
        </CardContent>
      </Card>
    )
  }

  const revenue = ext.umsatzerloese || 0

  return (
    <div className="space-y-4">
      {/* Key Figures Summary */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <div className="rounded-lg border p-3 bg-green-500/5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Umsatz</p>
          <p className="text-lg font-bold text-green-600 tabular-nums mt-0.5">{formatCurrency(revenue)}</p>
        </div>
        <div className="rounded-lg border p-3 bg-red-500/5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Gesamtkosten</p>
          <p className="text-lg font-bold text-red-600 tabular-nums mt-0.5">{formatCurrency(ext.gesamtkosten)}</p>
        </div>
        <div className={`rounded-lg border p-3 ${(ext.betriebsergebnis || 0) >= 0 ? "bg-blue-500/5" : "bg-amber-500/5"}`}>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">EBIT</p>
          <p className={`text-lg font-bold tabular-nums mt-0.5 ${(ext.betriebsergebnis || 0) >= 0 ? "text-blue-600" : "text-amber-600"}`}>
            {formatCurrency(ext.betriebsergebnis)}
          </p>
        </div>
        <div className="rounded-lg border p-3 bg-primary/5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Rendite</p>
          <p className={`text-lg font-bold tabular-nums mt-0.5 ${(ext.umsatzrendite || 0) >= 0 ? "text-primary" : "text-red-600"}`}>
            {ext.umsatzrendite?.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Revenue Positions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Euro className="h-4 w-4 text-green-500" />
            Erlöse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <div className="divide-y">
              {[
                { label: "Umsatzerlöse", value: ext.umsatzerloese },
                { label: "Sonstige betriebliche Erlöse", value: ext.sonstige_erloese },
                { label: "Privatentnahmen / Eigenverbrauch", value: ext.privatentnahmen },
              ].filter(i => i.value).map((item) => (
                <div key={item.label} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors">
                  <span className="text-sm">{item.label}</span>
                  <span className="text-sm font-semibold tabular-nums text-green-600">{formatCurrency(item.value)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3 bg-green-500/5 font-bold">
                <span className="text-sm">Gesamterlöse</span>
                <span className="text-base tabular-nums text-green-600">{formatCurrency(ext.gesamterloese || revenue)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Positions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            Kosten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <div className="divide-y">
              {[
                { label: "Personalkosten", value: ext.personalkosten },
                { label: "Materialaufwand / Wareneinsatz", value: ext.materialaufwand },
                { label: "Raumkosten / Miete", value: ext.raumkosten },
                { label: "Abschreibungen", value: ext.abschreibungen },
                { label: "Versicherungen / Beiträge", value: ext.versicherungen },
                { label: "Kfz-Kosten", value: ext.kfz_kosten },
                { label: "Werbe- / Reisekosten", value: ext.werbung_reise },
                { label: "Zinsaufwand", value: ext.zinsen },
                { label: "Sonstige Kosten", value: ext.sonstige_kosten },
              ].filter(i => i.value).map((item) => {
                const pct = revenue > 0 ? ((item.value || 0) / revenue * 100) : 0
                return (
                  <div key={item.label} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors">
                    <span className="text-sm">{item.label}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground tabular-nums">{pct.toFixed(1)}%</span>
                      <span className="text-sm font-semibold tabular-nums text-red-600 w-28 text-right">{formatCurrency(item.value)}</span>
                    </div>
                  </div>
                )
              })}
              <div className="flex items-center justify-between px-4 py-3 bg-red-500/5 font-bold">
                <span className="text-sm">Gesamtkosten</span>
                <span className="text-base tabular-nums text-red-600">{formatCurrency(ext.gesamtkosten)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Ergebnisse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <div className="divide-y">
              {[
                { label: "Rohertrag / Rohgewinn", value: ext.rohertrag },
                { label: "Betriebsergebnis (EBIT)", value: ext.betriebsergebnis },
                { label: "Vorläufiges Ergebnis", value: ext.vorlaeufiges_ergebnis },
              ].filter(i => i.value !== undefined && i.value !== null).map((item) => (
                <div key={item.label} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className={`text-base font-bold tabular-nums ${(item.value || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Ratios */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Percent className="h-4 w-4 text-primary" />
            Kennzahlen
          </CardTitle>
          <CardDescription>Wichtige betriebswirtschaftliche Kennzahlen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Personalquote</p>
              <p className="text-2xl font-bold tabular-nums">{ext.personalquote?.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {(ext.personalquote || 0) < 35 ? "Sehr gut" : (ext.personalquote || 0) < 45 ? "Normal" : "Erhöht"}
              </p>
              <Progress
                value={Math.min(ext.personalquote || 0, 100)}
                className={`h-2 mt-2 ${(ext.personalquote || 0) < 35 ? "[&>div]:bg-green-500" : (ext.personalquote || 0) < 45 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"}`}
              />
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Materialeinsatzquote</p>
              <p className="text-2xl font-bold tabular-nums">{ext.materialeinsatzquote?.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                {(ext.materialeinsatzquote || 0) < 10 ? "Sehr gut" : (ext.materialeinsatzquote || 0) < 15 ? "Normal" : "Erhöht"}
              </p>
              <Progress
                value={Math.min((ext.materialeinsatzquote || 0) * 3, 100)}
                className={`h-2 mt-2 ${(ext.materialeinsatzquote || 0) < 10 ? "[&>div]:bg-green-500" : (ext.materialeinsatzquote || 0) < 15 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"}`}
              />
            </div>
            <div className="p-4 rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Umsatzrendite</p>
              <p className={`text-2xl font-bold tabular-nums ${(ext.umsatzrendite || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                {ext.umsatzrendite?.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {(ext.umsatzrendite || 0) > 20 ? "Exzellent" : (ext.umsatzrendite || 0) > 10 ? "Gut" : (ext.umsatzrendite || 0) > 0 ? "Ausbaufähig" : "Defizitär"}
              </p>
              <Progress
                value={Math.min(Math.max((ext.umsatzrendite || 0) + 10, 0), 100)}
                className={`h-2 mt-2 ${(ext.umsatzrendite || 0) > 20 ? "[&>div]:bg-green-500" : (ext.umsatzrendite || 0) > 10 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
