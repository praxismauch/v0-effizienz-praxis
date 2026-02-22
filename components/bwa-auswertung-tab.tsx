"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Euro,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  AlertTriangle,
  CheckCircle,
  Info,
  Target,
  Activity,
  ArrowRight,
  Lightbulb,
  ShieldCheck,
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts"
import { ChartContainer } from "@/components/ui/chart"

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "---"
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value)
}

const formatCurrencyShort = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "---"
  if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M €`
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}T €`
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value)
}

function calculateHealthScore(ext: any): { score: number; label: string; color: string; trend: string } {
  if (!ext) return { score: 0, label: "Keine Daten", color: "#94a3b8", trend: "neutral" }
  let score = 50

  if (ext.umsatzrendite > 25) score += 35
  else if (ext.umsatzrendite > 15) score += 25
  else if (ext.umsatzrendite > 5) score += 15
  else if (ext.umsatzrendite > 0) score += 5
  else score -= 15

  if (ext.personalquote < 30) score += 15
  else if (ext.personalquote < 40) score += 10
  else if (ext.personalquote < 50) score += 0
  else score -= 10

  score = Math.max(0, Math.min(100, score))
  const label = score >= 80 ? "Exzellent" : score >= 60 ? "Gut" : score >= 40 ? "Ausbaufähig" : "Kritisch"
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#3b82f6" : score >= 40 ? "#f59e0b" : "#ef4444"
  const trend = score >= 70 ? "up" : score >= 40 ? "stable" : "down"
  return { score, label, color, trend }
}

interface BWAAuswertungTabProps {
  ext: any
  monthLabel: string
  year: number
}

export function BWAAuswertungTab({ ext, monthLabel, year }: BWAAuswertungTabProps) {
  if (!ext) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <BarChart3 className="h-14 w-14 mx-auto mb-4 text-muted-foreground opacity-40" />
          <p className="text-lg font-medium text-muted-foreground">Noch keine Auswertung möglich</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Laden Sie eine BWA-Datei hoch und starten Sie die KI-Analyse, um hier detaillierte
            Diagramme und Auswertungen zu sehen.
          </p>
        </CardContent>
      </Card>
    )
  }

  const health = calculateHealthScore(ext)
  const revenue = ext.umsatzerloese || 0
  const totalCosts = ext.gesamtkosten || 1
  const profit = ext.betriebsergebnis || 0

  // Waterfall flow data
  const flowData = [
    { name: "Umsatz", value: revenue, type: "revenue" },
    { name: "Material", value: -(ext.materialaufwand || 0), type: "cost" },
    { name: "Personal", value: -(ext.personalkosten || 0), type: "cost" },
    { name: "Raum", value: -(ext.raumkosten || 0), type: "cost" },
    {
      name: "Sonstige",
      value: -(
        (ext.versicherungen || 0) + (ext.kfz_kosten || 0) +
        (ext.werbung_reise || 0) + (ext.abschreibungen || 0) +
        (ext.zinsen || 0) + (ext.sonstige_kosten || 0)
      ),
      type: "cost",
    },
    { name: "Ergebnis", value: profit, type: "result" },
  ]

  // Cost breakdown data
  const costItems = [
    { name: "Personal", value: ext.personalkosten || 0, fill: "#6366f1" },
    { name: "Raum", value: ext.raumkosten || 0, fill: "#8b5cf6" },
    { name: "Material", value: ext.materialaufwand || 0, fill: "#a78bfa" },
    { name: "AfA", value: ext.abschreibungen || 0, fill: "#c4b5fd" },
    { name: "Versicherung", value: ext.versicherungen || 0, fill: "#ddd6fe" },
    { name: "Kfz", value: ext.kfz_kosten || 0, fill: "#818cf8" },
    { name: "Werbung", value: ext.werbung_reise || 0, fill: "#a5b4fc" },
    { name: "Zinsen", value: ext.zinsen || 0, fill: "#c7d2fe" },
    { name: "Sonstige", value: ext.sonstige_kosten || 0, fill: "#e0e7ff" },
  ].filter(item => item.value > 0).sort((a, b) => b.value - a.value)

  // Revenue vs costs donut
  const donutData = [
    { name: "Ergebnis", value: Math.max(profit, 0), fill: "#22c55e" },
    { name: "Kosten", value: totalCosts, fill: "#ef4444" },
  ].filter(item => item.value > 0)
  if (profit < 0) {
    donutData[0] = { name: "Verlust", value: Math.abs(profit), fill: "#f59e0b" }
  }

  // Radar data
  const umsatzRenditeNorm = Math.min(Math.max((ext.umsatzrendite || 0) / 30 * 100, 0), 100)
  const personalQuoteNorm = Math.min(Math.max((60 - (ext.personalquote || 50)) / 40 * 100, 0), 100)
  const materialQuoteNorm = Math.min(Math.max((30 - (ext.materialeinsatzquote || 15)) / 25 * 100, 0), 100)
  const rohertragNorm = revenue > 0 ? Math.min(((ext.rohertrag || 0) / revenue) * 100, 100) : 0

  const radarData = [
    { metric: "Rendite", value: umsatzRenditeNorm, fullMark: 100 },
    { metric: "Personaleffizienz", value: personalQuoteNorm, fullMark: 100 },
    { metric: "Materialeffizienz", value: materialQuoteNorm, fullMark: 100 },
    { metric: "Rohertrag", value: rohertragNorm, fullMark: 100 },
    { metric: "Gesamtbewertung", value: Math.min(health.score, 100), fullMark: 100 },
  ]

  // Cost share percentages for detailed analysis
  const costAnalysis = [
    { label: "Personalkosten", value: ext.personalkosten || 0, pctOfRevenue: revenue > 0 ? ((ext.personalkosten || 0) / revenue * 100) : 0, pctOfCosts: ((ext.personalkosten || 0) / totalCosts * 100), benchmark: "30-45%", status: (ext.personalquote || 0) < 35 ? "good" : (ext.personalquote || 0) < 45 ? "ok" : "warn", color: "#6366f1" },
    { label: "Raumkosten", value: ext.raumkosten || 0, pctOfRevenue: revenue > 0 ? ((ext.raumkosten || 0) / revenue * 100) : 0, pctOfCosts: ((ext.raumkosten || 0) / totalCosts * 100), benchmark: "8-15%", status: revenue > 0 && (ext.raumkosten || 0) / revenue < 0.15 ? "good" : "ok", color: "#8b5cf6" },
    { label: "Materialaufwand", value: ext.materialaufwand || 0, pctOfRevenue: revenue > 0 ? ((ext.materialaufwand || 0) / revenue * 100) : 0, pctOfCosts: ((ext.materialaufwand || 0) / totalCosts * 100), benchmark: "5-15%", status: (ext.materialeinsatzquote || 0) < 10 ? "good" : (ext.materialeinsatzquote || 0) < 15 ? "ok" : "warn", color: "#a78bfa" },
    { label: "Abschreibungen", value: ext.abschreibungen || 0, pctOfRevenue: revenue > 0 ? ((ext.abschreibungen || 0) / revenue * 100) : 0, pctOfCosts: ((ext.abschreibungen || 0) / totalCosts * 100), benchmark: "3-8%", status: "ok" as const, color: "#c4b5fd" },
    { label: "Versicherungen", value: ext.versicherungen || 0, pctOfRevenue: revenue > 0 ? ((ext.versicherungen || 0) / revenue * 100) : 0, pctOfCosts: ((ext.versicherungen || 0) / totalCosts * 100), benchmark: "2-5%", status: "ok" as const, color: "#ddd6fe" },
    { label: "Sonstige Kosten", value: ext.sonstige_kosten || 0, pctOfRevenue: revenue > 0 ? ((ext.sonstige_kosten || 0) / revenue * 100) : 0, pctOfCosts: ((ext.sonstige_kosten || 0) / totalCosts * 100), benchmark: "5-10%", status: "ok" as const, color: "#e0e7ff" },
  ].filter(item => item.value > 0)

  // Gauge segments for the health score
  const gaugeSegments = [
    { min: 0, max: 25, color: "#ef4444", label: "Kritisch" },
    { min: 25, max: 50, color: "#f59e0b", label: "Ausbaufähig" },
    { min: 50, max: 75, color: "#3b82f6", label: "Gut" },
    { min: 75, max: 100, color: "#22c55e", label: "Exzellent" },
  ]

  return (
    <div className="space-y-6">
      {/* Top Row: Health Score + Executive Summary + Radar */}
      <div className="grid gap-4 md:grid-cols-12">
        {/* Health Score Gauge */}
        <Card className="md:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" style={{ color: health.color }} />
              Gesundheitsindex
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-2">
              <div className="relative flex items-center justify-center">
                <svg className="h-36 w-36 -rotate-90" viewBox="0 0 120 120">
                  {/* Background track */}
                  <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted/20" />
                  {/* Colored segments */}
                  {gaugeSegments.map((seg, i) => {
                    const circumference = 2 * Math.PI * 52
                    const segSize = (seg.max - seg.min) / 100
                    return (
                      <circle
                        key={i}
                        cx="60" cy="60" r="52"
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="10"
                        strokeDasharray={`${segSize * circumference} ${circumference}`}
                        strokeDashoffset={-(seg.min / 100) * circumference}
                        opacity={health.score >= seg.min ? 0.3 : 0.08}
                      />
                    )
                  })}
                  {/* Active arc */}
                  <circle
                    cx="60" cy="60" r="52" fill="none" stroke={health.color} strokeWidth="10"
                    strokeDasharray={`${(health.score / 100) * 327} 327`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-bold tabular-nums" style={{ color: health.color }}>{health.score}</span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-[0.2em]">von 100</span>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="text-xs px-3 py-1 font-semibold"
                style={{ backgroundColor: `${health.color}15`, color: health.color, borderColor: `${health.color}30` }}
              >
                {health.label}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Executive Summary KPIs */}
        <Card className="md:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Ergebnis auf einen Blick
            </CardTitle>
            <CardDescription>{monthLabel} {year}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3 bg-green-500/5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Umsatz</p>
                <p className="text-xl font-bold text-green-600 tabular-nums mt-0.5">{formatCurrencyShort(revenue)}</p>
              </div>
              <div className="rounded-lg border p-3 bg-red-500/5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Kosten</p>
                <p className="text-xl font-bold text-red-600 tabular-nums mt-0.5">{formatCurrencyShort(totalCosts)}</p>
              </div>
              <div className={`rounded-lg border p-3 ${profit >= 0 ? "bg-blue-500/5" : "bg-amber-500/5"}`}>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">EBIT</p>
                <p className={`text-xl font-bold tabular-nums mt-0.5 ${profit >= 0 ? "text-blue-600" : "text-amber-600"}`}>{formatCurrencyShort(profit)}</p>
              </div>
              <div className="rounded-lg border p-3 bg-primary/5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Rendite</p>
                <p className={`text-xl font-bold tabular-nums mt-0.5 ${(ext.umsatzrendite || 0) >= 0 ? "text-primary" : "text-red-600"}`}>{ext.umsatzrendite?.toFixed(1)}%</p>
              </div>
            </div>
            {/* Mini comparison bar */}
            <div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span>Kosten vs. Umsatz</span>
                <span>{revenue > 0 ? ((totalCosts / revenue) * 100).toFixed(0) : 0}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(revenue > 0 ? (totalCosts / revenue) * 100 : 0, 100)}%`,
                    background: revenue > 0 && totalCosts / revenue > 0.9 ? "#ef4444" : totalCosts / revenue > 0.7 ? "#f59e0b" : "#22c55e",
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Radar Performance Profile */}
        <Card className="md:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4 text-primary" />
              Leistungsprofil
            </CardTitle>
            <CardDescription>Normalisiert: 100 = optimaler Wert</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ value: { label: "Wert", color: "#6366f1" } }}
              className="h-[210px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="#e2e8f0" strokeOpacity={0.5} />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Wert" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} dot={{ r: 3, fill: "#6366f1" }} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ergebnisfluss - Waterfall */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Ergebnisfluss
          </CardTitle>
          <CardDescription>Vom Umsatz zum Betriebsergebnis - wohin fließt das Geld?</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ value: { label: "Betrag", color: "#6366f1" } }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flowData} margin={{ top: 15, right: 15, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f020" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatCurrencyShort(v)}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(Math.abs(value)), value >= 0 ? "Zufluss" : "Abfluss"]}
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }}
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

      {/* Cost Breakdown + Revenue Donut */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Cost Breakdown Horizontal Bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Kostenverteilung
            </CardTitle>
            <CardDescription>Top-Kostenpositionen nach Betrag</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{ value: { label: "Betrag", color: "#6366f1" } }}
              className="h-[280px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costItems.slice(0, 7)} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f020" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickFormatter={(v) => formatCurrencyShort(v)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} width={85} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Kosten"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {costItems.slice(0, 7).map((entry, index) => (
                      <Cell key={index} fill={entry.fill} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Revenue vs Costs Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Euro className="h-4 w-4 text-green-500" />
              Umsatzverwendung
            </CardTitle>
            <CardDescription>Wie wird der Umsatz verwendet?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <ChartContainer
                config={{
                  Ergebnis: { label: "Ergebnis", color: "#22c55e" },
                  Kosten: { label: "Kosten", color: "#ef4444" },
                }}
                className="h-[220px] flex-1"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", color: "hsl(var(--card-foreground))" }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px" }} />
                  </RechartsPie>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="space-y-3 pr-2 min-w-[110px]">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Umsatz</p>
                  <p className="text-lg font-bold text-green-600 tabular-nums">{formatCurrencyShort(revenue)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ergebnis</p>
                  <p className={`text-lg font-bold tabular-nums ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrencyShort(profit)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rendite</p>
                  <p className={`text-lg font-bold tabular-nums ${(ext.umsatzrendite || 0) >= 0 ? "text-blue-600" : "text-red-600"}`}>
                    {ext.umsatzrendite?.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Cost Analysis with Benchmarks */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            Kostenanalyse mit Branchenvergleich
          </CardTitle>
          <CardDescription>Einzelne Kostenpositionen mit Benchmark-Richtwerten für Arztpraxen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {costAnalysis.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.status === "good" && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                    {item.status === "warn" && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-[10px] font-normal h-5">
                      Richtwert: {item.benchmark}
                    </Badge>
                    <span className="text-xs text-muted-foreground tabular-nums">{item.pctOfRevenue.toFixed(1)}% v. Umsatz</span>
                    <span className="text-sm font-semibold tabular-nums w-24 text-right">{formatCurrency(item.value)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={Math.min(item.pctOfCosts, 100)}
                    className={`h-1.5 flex-1 ${item.status === "good" ? "[&>div]:bg-green-500" : item.status === "warn" ? "[&>div]:bg-amber-500" : ""}`}
                    style={item.status === "ok" ? { ["--tw-progress-fill" as any]: item.color } : undefined}
                  />
                  <span className="text-xs font-bold tabular-nums w-12 text-right text-muted-foreground">{item.pctOfCosts.toFixed(0)}%</span>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 mt-2 border-t">
              <span className="text-sm font-bold">Gesamtkosten</span>
              <span className="text-lg font-bold text-red-600 tabular-nums">{formatCurrency(totalCosts)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Insight Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Personalquote */}
        <Card className={`border-l-4 ${(ext.personalquote || 0) < 35 ? "border-l-green-500" : (ext.personalquote || 0) < 45 ? "border-l-amber-500" : "border-l-red-500"}`}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-3">
              {(ext.personalquote || 0) < 35 ? (
                <ShieldCheck className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              ) : (ext.personalquote || 0) < 45 ? (
                <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">Personalquote</p>
                  <Badge variant="secondary" className="h-5 text-[10px] font-bold tabular-nums">
                    {ext.personalquote?.toFixed(1)}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {(ext.personalquote || 0) < 35
                    ? "Sehr gut kontrolliert. Effiziente Teamstruktur und optimale Arbeitsaufteilung."
                    : (ext.personalquote || 0) < 45
                      ? "Im normalen Bereich. Beobachten Sie die Entwicklung bei Gehaltsanpassungen."
                      : "Erhöht. Prüfen Sie Optimierungsmöglichkeiten bei Arbeitszeiten oder Stellenplan."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Materialeinsatzquote */}
        <Card className={`border-l-4 ${(ext.materialeinsatzquote || 0) < 10 ? "border-l-green-500" : (ext.materialeinsatzquote || 0) < 15 ? "border-l-amber-500" : "border-l-red-500"}`}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-3">
              {(ext.materialeinsatzquote || 0) < 10 ? (
                <ShieldCheck className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              ) : (ext.materialeinsatzquote || 0) < 15 ? (
                <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">Materialeinsatz</p>
                  <Badge variant="secondary" className="h-5 text-[10px] font-bold tabular-nums">
                    {ext.materialeinsatzquote?.toFixed(1)}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {(ext.materialeinsatzquote || 0) < 10
                    ? "Sehr effizient. Gute Einkaufskonditionen und sparsamer Verbrauch."
                    : (ext.materialeinsatzquote || 0) < 15
                      ? "Im erwartbaren Rahmen. Regelmäßig Lieferantenvergleiche durchführen."
                      : "Überdurchschnittlich hoch. Prüfen Sie Lieferantenkonditionen und Verbrauchsmengen."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Umsatzrendite */}
        <Card className={`border-l-4 ${(ext.umsatzrendite || 0) > 20 ? "border-l-green-500" : (ext.umsatzrendite || 0) > 10 ? "border-l-blue-500" : (ext.umsatzrendite || 0) > 0 ? "border-l-amber-500" : "border-l-red-500"}`}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-3">
              {(ext.umsatzrendite || 0) > 20 ? (
                <ShieldCheck className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              ) : (ext.umsatzrendite || 0) > 10 ? (
                <TrendingUp className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              ) : (ext.umsatzrendite || 0) > 0 ? (
                <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">Umsatzrendite</p>
                  <Badge variant="secondary" className="h-5 text-[10px] font-bold tabular-nums">
                    {ext.umsatzrendite?.toFixed(1)}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {(ext.umsatzrendite || 0) > 20
                    ? "Exzellent! Ihre Praxis arbeitet höchst profitabel."
                    : (ext.umsatzrendite || 0) > 10
                      ? "Gute Rendite. Solide Basis für Investitionen."
                      : (ext.umsatzrendite || 0) > 0
                        ? "Positiv, aber ausbaufähig. Umsatz- und Kostenoptimierung prüfen."
                        : "Defizitär. Dringend Ursachenanalyse und Gegenmaßnahmen einleiten."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
