"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Euro,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart3,
  PieChart,
  Percent,
  AlertTriangle,
  CheckCircle,
  Info,
  Sparkles,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  PieChart as RechartsPie,
  Pie,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "---"
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value)
}

const formatCurrencyShort = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "---"
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}T`
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value)
}

// Health score calculation
function calculateHealthScore(ext: any): { score: number; label: string; color: string } {
  if (!ext) return { score: 0, label: "Keine Daten", color: "#94a3b8" }
  let score = 50

  // Umsatzrendite (weight: 35)
  if (ext.umsatzrendite > 25) score += 35
  else if (ext.umsatzrendite > 15) score += 25
  else if (ext.umsatzrendite > 5) score += 15
  else if (ext.umsatzrendite > 0) score += 5
  else score -= 15

  // Personalquote (weight: 15) - lower is better for practices
  if (ext.personalquote < 30) score += 15
  else if (ext.personalquote < 40) score += 10
  else if (ext.personalquote < 50) score += 0
  else score -= 10

  score = Math.max(0, Math.min(100, score))
  const label = score >= 80 ? "Exzellent" : score >= 60 ? "Gut" : score >= 40 ? "Ausbaufähig" : "Kritisch"
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#3b82f6" : score >= 40 ? "#f59e0b" : "#ef4444"
  return { score, label, color }
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
            Laden Sie eine BWA-Datei hoch und starten Sie die KI-Analyse, um hier detaillierte
            Finanzdaten und Auswertungen zu sehen.
          </p>
        </CardContent>
      </Card>
    )
  }

  const health = calculateHealthScore(ext)

  // Cost breakdown data for bar chart
  const costItems = [
    { name: "Personal", value: ext.personalkosten || 0, fill: "#6366f1" },
    { name: "Raum", value: ext.raumkosten || 0, fill: "#8b5cf6" },
    { name: "Material", value: ext.materialaufwand || 0, fill: "#a78bfa" },
    { name: "Abschreibung", value: ext.abschreibungen || 0, fill: "#c4b5fd" },
    { name: "Versicherung", value: ext.versicherungen || 0, fill: "#ddd6fe" },
    { name: "Kfz", value: ext.kfz_kosten || 0, fill: "#ede9fe" },
    { name: "Werbung", value: ext.werbung_reise || 0, fill: "#f5f3ff" },
    { name: "Zinsen", value: ext.zinsen || 0, fill: "#eef2ff" },
    { name: "Sonstige", value: ext.sonstige_kosten || 0, fill: "#e0e7ff" },
  ].filter(item => item.value > 0).sort((a, b) => b.value - a.value)

  // Revenue vs costs pie
  const revenueVsCosts = [
    { name: "Gewinn", value: Math.max(ext.betriebsergebnis || 0, 0), fill: "#22c55e" },
    { name: "Kosten", value: ext.gesamtkosten || 0, fill: "#ef4444" },
  ].filter(item => item.value > 0)

  // If there's a loss, show it differently
  if ((ext.betriebsergebnis || 0) < 0) {
    revenueVsCosts[0] = { name: "Verlust", value: Math.abs(ext.betriebsergebnis || 0), fill: "#f59e0b" }
  }

  // Kennzahlen radar data
  const umsatzRenditeNorm = Math.min(Math.max((ext.umsatzrendite || 0) / 30 * 100, 0), 100)
  const personalQuoteNorm = Math.min(Math.max((60 - (ext.personalquote || 50)) / 40 * 100, 0), 100)
  const materialQuoteNorm = Math.min(Math.max((30 - (ext.materialeinsatzquote || 15)) / 25 * 100, 0), 100)
  const rohertragNorm = ext.umsatzerloese > 0 ? Math.min(((ext.rohertrag || 0) / ext.umsatzerloese) * 100, 100) : 0

  const radarData = [
    { metric: "Rendite", value: umsatzRenditeNorm, fullMark: 100 },
    { metric: "Personal", value: personalQuoteNorm, fullMark: 100 },
    { metric: "Material", value: materialQuoteNorm, fullMark: 100 },
    { metric: "Rohertrag", value: rohertragNorm, fullMark: 100 },
    { metric: "Effizienz", value: Math.min((health.score), 100), fullMark: 100 },
  ]

  // Waterfall-like flow data: Revenue -> Costs -> Result
  const flowData = [
    { name: "Umsatz", value: ext.umsatzerloese || 0, type: "revenue" },
    { name: "Material", value: -(ext.materialaufwand || 0), type: "cost" },
    { name: "Personal", value: -(ext.personalkosten || 0), type: "cost" },
    { name: "Raum", value: -(ext.raumkosten || 0), type: "cost" },
    { name: "Sonstige K.", value: -(
      (ext.versicherungen || 0) + (ext.kfz_kosten || 0) +
      (ext.werbung_reise || 0) + (ext.abschreibungen || 0) +
      (ext.zinsen || 0) + (ext.sonstige_kosten || 0)
    ), type: "cost" },
    { name: "Ergebnis", value: ext.betriebsergebnis || 0, type: "result" },
  ]

  // Cost percentages for the detailed breakdown
  const totalCosts = ext.gesamtkosten || 1
  const costPercentages = [
    { label: "Personalkosten", value: ext.personalkosten || 0, pct: ((ext.personalkosten || 0) / totalCosts * 100), benchmark: "30-45%", color: "#6366f1" },
    { label: "Raumkosten / Miete", value: ext.raumkosten || 0, pct: ((ext.raumkosten || 0) / totalCosts * 100), benchmark: "8-15%", color: "#8b5cf6" },
    { label: "Materialaufwand", value: ext.materialaufwand || 0, pct: ((ext.materialaufwand || 0) / totalCosts * 100), benchmark: "5-15%", color: "#a78bfa" },
    { label: "Abschreibungen", value: ext.abschreibungen || 0, pct: ((ext.abschreibungen || 0) / totalCosts * 100), benchmark: "3-8%", color: "#c4b5fd" },
    { label: "Versicherungen", value: ext.versicherungen || 0, pct: ((ext.versicherungen || 0) / totalCosts * 100), benchmark: "2-5%", color: "#ddd6fe" },
    { label: "Sonstige Kosten", value: ext.sonstige_kosten || 0, pct: ((ext.sonstige_kosten || 0) / totalCosts * 100), benchmark: "5-10%", color: "#e0e7ff" },
  ].filter(item => item.value > 0)

  return (
    <div className="space-y-6">
      {/* Health Score + Summary Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Praxis Health Score */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Praxis-Gesundheitsindex</CardTitle>
            <CardDescription>{monthLabel} {year}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-3">
              <div className="relative flex items-center justify-center">
                <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
                  <circle
                    cx="60" cy="60" r="52" fill="none" stroke={health.color} strokeWidth="8"
                    strokeDasharray={`${(health.score / 100) * 327} 327`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold" style={{ color: health.color }}>{health.score}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">/ 100</span>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="text-xs px-3 py-1"
                style={{ backgroundColor: `${health.color}20`, color: health.color, borderColor: `${health.color}40` }}
              >
                {health.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Kennzahlen Radar */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              Leistungsprofil
            </CardTitle>
            <CardDescription>Normalisierte Kennzahlen im Vergleich (100 = Optimum)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: { label: "Wert", color: "#6366f1" },
              }}
              className="h-[200px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Wert" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Flow (Waterfall-style) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Ergebnisfluss
          </CardTitle>
          <CardDescription>Vom Umsatz zum Betriebsergebnis - Wohin fließt das Geld?</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              value: { label: "Betrag", color: "#6366f1" },
            }}
            className="h-[280px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flowData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f030" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatCurrencyShort(v)}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(Math.abs(value)), value >= 0 ? "Zufluss" : "Abfluss"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", background: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {flowData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.type === "revenue" ? "#22c55e" : entry.type === "cost" ? "#ef4444" : (entry.value >= 0 ? "#3b82f6" : "#f59e0b")}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Detailed Cost Breakdown + Revenue Split */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Cost Breakdown Bar Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Kostenverteilung
            </CardTitle>
            <CardDescription>Top-Kostenpositionen nach Anteil</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: { label: "Betrag", color: "#6366f1" },
              }}
              className="h-[260px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costItems.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f030" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickFormatter={(v) => formatCurrencyShort(v)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} width={80} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Kosten"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", background: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {costItems.slice(0, 6).map((entry, index) => (
                      <Cell key={index} fill={entry.fill} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue vs Costs Pie */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Euro className="h-4 w-4 text-green-500" />
              Ergebnis-Anteil am Umsatz
            </CardTitle>
            <CardDescription>
              Wie viel vom Umsatz bleibt als Gewinn?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ChartContainer
                config={{
                  Gewinn: { label: "Gewinn", color: "#22c55e" },
                  Kosten: { label: "Kosten", color: "#ef4444" },
                }}
                className="h-[200px] flex-1"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={revenueVsCosts}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {revenueVsCosts.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", background: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }}
                    />
                    <Legend />
                  </RechartsPie>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="space-y-3 pr-2">
                <div>
                  <p className="text-xs text-muted-foreground">Umsatz</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(ext.umsatzerloese)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ergebnis</p>
                  <p className={`text-lg font-bold ${(ext.betriebsergebnis || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(ext.betriebsergebnis)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rendite</p>
                  <p className={`text-lg font-bold ${(ext.umsatzrendite || 0) >= 0 ? "text-blue-600" : "text-red-600"}`}>
                    {ext.umsatzrendite?.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Cost Table with Benchmarks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            Kostenanalyse im Detail
          </CardTitle>
          <CardDescription>
            Einzelne Kostenpositionen mit Benchmark-Vergleichswerten für Arztpraxen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {costPercentages.map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-[10px] font-normal">
                      Richtwert: {item.benchmark}
                    </Badge>
                    <span className="text-sm font-semibold tabular-nums w-24 text-right">{formatCurrency(item.value)}</span>
                    <span className="text-sm font-bold tabular-nums w-16 text-right">{item.pct.toFixed(1)}%</span>
                  </div>
                </div>
                <Progress
                  value={Math.min(item.pct * 2, 100)}
                  className="h-1.5"
                  style={{ ["--progress-color" as any]: item.color }}
                />
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 mt-3 border-t">
              <span className="text-sm font-bold">Gesamtkosten</span>
              <span className="text-lg font-bold text-red-600">{formatCurrency(ext.gesamtkosten)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Personalquote Insight */}
        <Card className={ext.personalquote < 35 ? "border-green-500/20" : ext.personalquote < 45 ? "border-amber-500/20" : "border-red-500/20"}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {ext.personalquote < 35 ? (
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              ) : ext.personalquote < 45 ? (
                <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-semibold">Personalquote: {ext.personalquote?.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {ext.personalquote < 35
                    ? "Ihre Personalkosten sind sehr gut kontrolliert. Dies deutet auf eine effiziente Teamstruktur hin."
                    : ext.personalquote < 45
                      ? "Ihre Personalkosten liegen im normalen Bereich. Beobachten Sie die Entwicklung weiter."
                      : "Ihre Personalkosten sind erhöht. Prüfen Sie Optimierungsmöglichkeiten bei Arbeitszeiten oder Stellenplan."}
                </p>
                <div className="mt-2">
                  <Progress
                    value={Math.min(ext.personalquote, 60) / 60 * 100}
                    className={`h-1.5 ${ext.personalquote < 35 ? "[&>div]:bg-green-500" : ext.personalquote < 45 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"}`}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Materialeinsatzquote Insight */}
        <Card className={ext.materialeinsatzquote < 10 ? "border-green-500/20" : ext.materialeinsatzquote < 15 ? "border-amber-500/20" : "border-red-500/20"}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {ext.materialeinsatzquote < 10 ? (
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              ) : ext.materialeinsatzquote < 15 ? (
                <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-semibold">Materialeinsatz: {ext.materialeinsatzquote?.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {ext.materialeinsatzquote < 10
                    ? "Der Materialeinsatz ist sehr effizient. Dies spricht für gute Einkaufskonditionen."
                    : ext.materialeinsatzquote < 15
                      ? "Der Materialeinsatz liegt im erwartbaren Rahmen für eine Praxis."
                      : "Der Materialeinsatz ist überdurchschnittlich hoch. Prüfen Sie Lieferantenkonditionen und Verbrauch."}
                </p>
                <div className="mt-2">
                  <Progress
                    value={Math.min(ext.materialeinsatzquote, 30) / 30 * 100}
                    className={`h-1.5 ${ext.materialeinsatzquote < 10 ? "[&>div]:bg-green-500" : ext.materialeinsatzquote < 15 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"}`}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Umsatzrendite Insight */}
        <Card className={ext.umsatzrendite > 20 ? "border-green-500/20" : ext.umsatzrendite > 10 ? "border-blue-500/20" : ext.umsatzrendite > 0 ? "border-amber-500/20" : "border-red-500/20"}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {ext.umsatzrendite > 20 ? (
                <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              ) : ext.umsatzrendite > 10 ? (
                <TrendingUp className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              ) : ext.umsatzrendite > 0 ? (
                <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-semibold">Umsatzrendite: {ext.umsatzrendite?.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {ext.umsatzrendite > 20
                    ? "Exzellente Rendite! Ihre Praxis arbeitet höchst profitabel."
                    : ext.umsatzrendite > 10
                      ? "Gute Rendite. Ihre Praxis ist solide aufgestellt."
                      : ext.umsatzrendite > 0
                        ? "Die Rendite ist positiv, aber ausbaufähig. Prüfen Sie Umsatz- und Kostenoptimierung."
                        : "Die Praxis arbeitet defizitär. Dringend Ursachenanalyse und Maßnahmen einleiten."}
                </p>
                <div className="mt-2">
                  <Progress
                    value={Math.min(Math.max(ext.umsatzrendite + 10, 0), 50) / 50 * 100}
                    className={`h-1.5 ${ext.umsatzrendite > 20 ? "[&>div]:bg-green-500" : ext.umsatzrendite > 10 ? "[&>div]:bg-blue-500" : ext.umsatzrendite > 0 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500"}`}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Complete Financial Summary Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Euro className="h-4 w-4 text-primary" />
            Vollständige BWA-Übersicht
          </CardTitle>
          <CardDescription>Alle extrahierten Positionen mit Umsatzanteilen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Erlöse */}
            <div>
              <h4 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Erlöse
              </h4>
              <div className="rounded-lg border overflow-hidden">
                <div className="divide-y">
                  {[
                    { label: "Umsatzerlöse", value: ext.umsatzerloese },
                    { label: "Sonstige Erlöse", value: ext.sonstige_erloese },
                    { label: "Privatentnahmen", value: ext.privatentnahmen },
                  ].filter(i => i.value).map((item) => (
                    <div key={item.label} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30">
                      <span className="text-sm">{item.label}</span>
                      <span className="text-sm font-semibold tabular-nums text-green-600">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-3 bg-green-500/5 font-bold">
                    <span className="text-sm">Gesamterlöse</span>
                    <span className="text-base tabular-nums text-green-600">{formatCurrency(ext.gesamterloese || ext.umsatzerloese)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kosten */}
            <div>
              <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                Kosten
              </h4>
              <div className="rounded-lg border overflow-hidden">
                <div className="divide-y">
                  {[
                    { label: "Personalkosten", value: ext.personalkosten },
                    { label: "Materialaufwand", value: ext.materialaufwand },
                    { label: "Raumkosten / Miete", value: ext.raumkosten },
                    { label: "Abschreibungen", value: ext.abschreibungen },
                    { label: "Versicherungen / Beiträge", value: ext.versicherungen },
                    { label: "Kfz-Kosten", value: ext.kfz_kosten },
                    { label: "Werbe- / Reisekosten", value: ext.werbung_reise },
                    { label: "Zinsaufwand", value: ext.zinsen },
                    { label: "Sonstige Kosten", value: ext.sonstige_kosten },
                  ].filter(i => i.value).map((item) => {
                    const pct = ext.umsatzerloese > 0 ? ((item.value || 0) / ext.umsatzerloese * 100) : 0
                    return (
                      <div key={item.label} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/30">
                        <span className="text-sm">{item.label}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground tabular-nums">{pct.toFixed(1)}% v. Umsatz</span>
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
            </div>

            {/* Ergebnisse */}
            <div>
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Ergebnisse
              </h4>
              <div className="rounded-lg border overflow-hidden">
                <div className="divide-y">
                  {[
                    { label: "Rohertrag", value: ext.rohertrag },
                    { label: "Betriebsergebnis (EBIT)", value: ext.betriebsergebnis },
                    { label: "Vorläufiges Ergebnis", value: ext.vorlaeufiges_ergebnis },
                  ].filter(i => i.value !== undefined && i.value !== null).map((item) => (
                    <div key={item.label} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30">
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className={`text-base font-bold tabular-nums ${(item.value || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
