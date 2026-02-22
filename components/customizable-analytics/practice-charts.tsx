"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts"
import { TrendingUp, TrendingDown } from "lucide-react"

const COLORS = {
  primary: "#6366f1",
  secondary: "#10b981",
  tertiary: "#f59e0b",
  quaternary: "#ef4444",
  fifth: "#8b5cf6",
  sixth: "#06b6d4",
  muted: "#94a3b8",
}

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"]

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
}

const formatEuro = (v: number) => `${v.toLocaleString("de-DE")} \u20AC`

// ── 1. Revenue Monthly ──

const revenueMonthlyData = [
  { month: "Jan", current: 42500, previous: 38200, budget: 45000 },
  { month: "Feb", current: 44800, previous: 39500, budget: 45000 },
  { month: "Mär", current: 48200, previous: 42100, budget: 46000 },
  { month: "Apr", current: 46100, previous: 41800, budget: 46000 },
  { month: "Mai", current: 43900, previous: 40200, budget: 45000 },
  { month: "Jun", current: 47300, previous: 43500, budget: 46000 },
  { month: "Jul", current: 41200, previous: 38900, budget: 44000 },
  { month: "Aug", current: 39800, previous: 36700, budget: 42000 },
  { month: "Sep", current: 49100, previous: 44200, budget: 47000 },
  { month: "Okt", current: 51200, previous: 45800, budget: 48000 },
  { month: "Nov", current: 50400, previous: 46100, budget: 48000 },
  { month: "Dez", current: 45600, previous: 41300, budget: 45000 },
]

export function RevenueMonthlyChart() {
  const totalCurrent = revenueMonthlyData.reduce((s, d) => s + d.current, 0)
  const totalPrevious = revenueMonthlyData.reduce((s, d) => s + d.previous, 0)
  const growth = ((totalCurrent - totalPrevious) / totalPrevious * 100).toFixed(1)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Umsatzentwicklung</CardTitle>
            <CardDescription>Monatlicher Vergleich zum Vorjahr mit Budgetlinie</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
              <TrendingUp className="h-3 w-3" />{growth}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueMonthlyData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatEuro(v)} />
            <Legend />
            <Area type="monotone" dataKey="current" name="Aktuelles Jahr" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.15} strokeWidth={2} />
            <Area type="monotone" dataKey="previous" name="Vorjahr" stroke={COLORS.muted} fill={COLORS.muted} fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="budget" name="Budget" stroke={COLORS.tertiary} strokeWidth={1.5} strokeDasharray="6 3" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ── 2. Patient Flow ──

const patientFlowData = [
  { day: "Mo", patients: 42, newPatients: 8, returning: 34 },
  { day: "Di", patients: 38, newPatients: 6, returning: 32 },
  { day: "Mi", patients: 45, newPatients: 9, returning: 36 },
  { day: "Do", patients: 40, newPatients: 7, returning: 33 },
  { day: "Fr", patients: 35, newPatients: 5, returning: 30 },
  { day: "Sa", patients: 12, newPatients: 2, returning: 10 },
]

export function PatientFlowChart() {
  const avgPatients = Math.round(patientFlowData.reduce((s, d) => s + d.patients, 0) / patientFlowData.length)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Patientenaufkommen</CardTitle>
            <CardDescription>Durchschnittliche Patientenfrequenz nach Wochentag</CardDescription>
          </div>
          <Badge variant="secondary">{avgPatients} Pat./Tag</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={patientFlowData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="day" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Bar dataKey="returning" name="Bestandspatienten" stackId="a" fill={COLORS.primary} radius={[0, 0, 0, 0]} />
            <Bar dataKey="newPatients" name="Neupatienten" stackId="a" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ── 3. Appointment Analysis ──

const appointmentData = [
  { hour: "08:00", slots: 6, booked: 5, utilization: 83 },
  { hour: "09:00", slots: 6, booked: 6, utilization: 100 },
  { hour: "10:00", slots: 6, booked: 6, utilization: 100 },
  { hour: "11:00", slots: 6, booked: 5, utilization: 83 },
  { hour: "12:00", slots: 4, booked: 3, utilization: 75 },
  { hour: "13:00", slots: 2, booked: 1, utilization: 50 },
  { hour: "14:00", slots: 6, booked: 5, utilization: 83 },
  { hour: "15:00", slots: 6, booked: 6, utilization: 100 },
  { hour: "16:00", slots: 6, booked: 4, utilization: 67 },
  { hour: "17:00", slots: 4, booked: 2, utilization: 50 },
]

export function AppointmentAnalysisChart() {
  const avgUtil = Math.round(appointmentData.reduce((s, d) => s + d.utilization, 0) / appointmentData.length)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Terminauslastung</CardTitle>
            <CardDescription>Verfugbare vs. gebuchte Termine nach Tageszeit</CardDescription>
          </div>
          <Badge variant={avgUtil > 80 ? "default" : "secondary"}>{avgUtil}% Auslastung</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={appointmentData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="hour" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Bar dataKey="slots" name="Verfugbar" fill={COLORS.muted} radius={[4, 4, 0, 0]} opacity={0.4} />
            <Bar dataKey="booked" name="Gebucht" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ── 4. Cost Breakdown ──

const costData = [
  { name: "Personal", value: 45, amount: 28500 },
  { name: "Miete & Nebenkosten", value: 18, amount: 11400 },
  { name: "Material & Medikamente", value: 12, amount: 7600 },
  { name: "Gerate & Wartung", value: 8, amount: 5100 },
  { name: "Versicherungen", value: 6, amount: 3800 },
  { name: "IT & Software", value: 5, amount: 3200 },
  { name: "Sonstiges", value: 6, amount: 3800 },
]

export function CostBreakdownChart() {
  const totalCost = costData.reduce((s, d) => s + d.amount, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Kostenstruktur</CardTitle>
            <CardDescription>Monatliche Praxiskosten nach Kategorie</CardDescription>
          </div>
          <Badge variant="outline">{formatEuro(totalCost)} /Monat</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={costData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} ${value}%`}>
                {costData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {costData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium">{formatEuro(item.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── 5. Team Workload ──

const teamWorkloadData = [
  { name: "Dr. Muller", stunden: 42, patienten: 120, auslastung: 92 },
  { name: "Dr. Schmidt", stunden: 38, patienten: 105, auslastung: 85 },
  { name: "MFA Meier", stunden: 40, patienten: 0, auslastung: 88 },
  { name: "MFA Huber", stunden: 36, patienten: 0, auslastung: 78 },
  { name: "MFA Koch", stunden: 38, patienten: 0, auslastung: 82 },
]

export function TeamWorkloadChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Team-Auslastung</CardTitle>
        <CardDescription>Wochentliche Arbeitsbelastung nach Mitarbeiter</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={teamWorkloadData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="name" className="text-xs" width={90} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
            <Bar dataKey="auslastung" name="Auslastung" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={24}>
              {teamWorkloadData.map((entry, i) => (
                <Cell key={i} fill={entry.auslastung > 90 ? COLORS.quaternary : entry.auslastung > 80 ? COLORS.tertiary : COLORS.secondary} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ── 6. Wait Time ──

const waitTimeData = [
  { time: "08-09", avg: 5, max: 12 },
  { time: "09-10", avg: 12, max: 25 },
  { time: "10-11", avg: 18, max: 35 },
  { time: "11-12", avg: 22, max: 40 },
  { time: "12-13", avg: 8, max: 15 },
  { time: "14-15", avg: 10, max: 20 },
  { time: "15-16", avg: 15, max: 28 },
  { time: "16-17", avg: 12, max: 22 },
  { time: "17-18", avg: 7, max: 14 },
]

export function WaitTimeChart() {
  const avgWait = Math.round(waitTimeData.reduce((s, d) => s + d.avg, 0) / waitTimeData.length)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Wartezeiten-Analyse</CardTitle>
            <CardDescription>Durchschnittliche und maximale Wartezeiten in Minuten</CardDescription>
          </div>
          <Badge variant={avgWait > 15 ? "destructive" : "secondary"}>{avgWait} Min. Durchschnitt</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={waitTimeData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="time" className="text-xs" />
            <YAxis className="text-xs" tickFormatter={(v) => `${v} Min`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v} Min.`} />
            <Legend />
            <Area type="monotone" dataKey="max" name="Maximum" stroke={COLORS.quaternary} fill={COLORS.quaternary} fillOpacity={0.1} strokeWidth={1} />
            <Area type="monotone" dataKey="avg" name="Durchschnitt" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.2} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ── 7. Treatment Mix ──

const treatmentData = [
  { name: "Untersuchung", count: 320, revenue: 16000 },
  { name: "Beratung", count: 180, revenue: 9000 },
  { name: "Labor", count: 140, revenue: 14000 },
  { name: "Sonografie", count: 85, revenue: 12750 },
  { name: "EKG", count: 60, revenue: 4800 },
  { name: "Impfung", count: 45, revenue: 2250 },
  { name: "IGeL", count: 35, revenue: 8750 },
  { name: "Sonstige", count: 55, revenue: 5500 },
]

export function TreatmentMixChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Leistungsmix</CardTitle>
        <CardDescription>Haufigste Leistungen nach Anzahl und Umsatz</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={treatmentData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" angle={-30} textAnchor="end" height={60} />
            <YAxis yAxisId="left" className="text-xs" />
            <YAxis yAxisId="right" orientation="right" className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Bar yAxisId="left" dataKey="count" name="Anzahl" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
            <Bar yAxisId="right" dataKey="revenue" name="Umsatz" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ── 8. Monthly Comparison ──

const monthlyCompData = [
  { metric: "Umsatz", jan: 42, feb: 44, mar: 48, apr: 46, mai: 44, jun: 47 },
  { metric: "Patienten", jan: 380, feb: 395, mar: 420, apr: 405, mai: 390, jun: 415 },
  { metric: "Neue Pat.", jan: 35, feb: 42, mar: 48, apr: 38, mai: 33, jun: 45 },
  { metric: "Auslastung %", jan: 82, feb: 85, mar: 91, apr: 87, mai: 84, jun: 89 },
]

const compMonths = [
  { month: "Jan", umsatz: 42500, patienten: 380, neuPat: 35, auslastung: 82 },
  { month: "Feb", umsatz: 44800, patienten: 395, neuPat: 42, auslastung: 85 },
  { month: "Mär", umsatz: 48200, patienten: 420, neuPat: 48, auslastung: 91 },
  { month: "Apr", umsatz: 46100, patienten: 405, neuPat: 38, auslastung: 87 },
  { month: "Mai", umsatz: 43900, patienten: 390, neuPat: 33, auslastung: 84 },
  { month: "Jun", umsatz: 47300, patienten: 415, neuPat: 45, auslastung: 89 },
]

export function MonthlyComparisonChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Monatsvergleich</CardTitle>
        <CardDescription>Wichtigste Kennzahlen im 6-Monats-Verlauf</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={compMonths}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis yAxisId="left" className="text-xs" />
            <YAxis yAxisId="right" orientation="right" className="text-xs" domain={[0, 100]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="patienten" name="Patienten" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 3 }} />
            <Line yAxisId="left" type="monotone" dataKey="neuPat" name="Neue Patienten" stroke={COLORS.secondary} strokeWidth={2} dot={{ r: 3 }} />
            <Line yAxisId="right" type="monotone" dataKey="auslastung" name="Auslastung %" stroke={COLORS.tertiary} strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ── 9. Cancellation Rate ──

const cancellationData = [
  { month: "Jan", absagen: 12, noShows: 5, quote: 4.5 },
  { month: "Feb", absagen: 10, noShows: 4, quote: 3.5 },
  { month: "Mär", absagen: 15, noShows: 7, quote: 5.2 },
  { month: "Apr", absagen: 8, noShows: 3, quote: 2.7 },
  { month: "Mai", absagen: 11, noShows: 6, quote: 4.4 },
  { month: "Jun", absagen: 9, noShows: 4, quote: 3.1 },
  { month: "Jul", absagen: 18, noShows: 8, quote: 6.5 },
  { month: "Aug", absagen: 22, noShows: 10, quote: 8.0 },
  { month: "Sep", absagen: 13, noShows: 5, quote: 4.3 },
  { month: "Okt", absagen: 10, noShows: 4, quote: 3.3 },
  { month: "Nov", absagen: 7, noShows: 3, quote: 2.4 },
  { month: "Dez", absagen: 14, noShows: 6, quote: 5.0 },
]

export function CancellationRateChart() {
  const avgQuote = (cancellationData.reduce((s, d) => s + d.quote, 0) / cancellationData.length).toFixed(1)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Absage-Quote</CardTitle>
            <CardDescription>Terminabsagen und No-Shows pro Monat</CardDescription>
          </div>
          <Badge variant={Number(avgQuote) > 5 ? "destructive" : "secondary"}>{avgQuote}% Durchschnitt</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={cancellationData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Bar dataKey="absagen" name="Absagen" stackId="a" fill={COLORS.tertiary} radius={[0, 0, 0, 0]} />
            <Bar dataKey="noShows" name="No-Shows" stackId="a" fill={COLORS.quaternary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ── 10. New vs Returning Patients ──

const newVsRetData = [
  { month: "Jan", neu: 35, bestand: 345 },
  { month: "Feb", neu: 42, bestand: 353 },
  { month: "Mär", neu: 48, bestand: 372 },
  { month: "Apr", neu: 38, bestand: 367 },
  { month: "Mai", neu: 33, bestand: 357 },
  { month: "Jun", neu: 45, bestand: 370 },
  { month: "Jul", neu: 30, bestand: 332 },
  { month: "Aug", neu: 28, bestand: 320 },
  { month: "Sep", neu: 52, bestand: 388 },
  { month: "Okt", neu: 55, bestand: 395 },
  { month: "Nov", neu: 50, bestand: 390 },
  { month: "Dez", neu: 38, bestand: 362 },
]

export function NewVsReturningChart() {
  const totalNew = newVsRetData.reduce((s, d) => s + d.neu, 0)
  const avgNewRate = (totalNew / newVsRetData.reduce((s, d) => s + d.neu + d.bestand, 0) * 100).toFixed(1)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Neue vs. Bestandspatienten</CardTitle>
            <CardDescription>Neupatientenanteil im Jahresverlauf</CardDescription>
          </div>
          <Badge variant="outline">{avgNewRate}% Neupatienten</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={newVsRetData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Area type="monotone" dataKey="bestand" name="Bestandspatienten" stackId="1" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.2} />
            <Area type="monotone" dataKey="neu" name="Neupatienten" stackId="1" stroke={COLORS.secondary} fill={COLORS.secondary} fillOpacity={0.4} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ── 11. Revenue per Doctor ──

const revenuePerDocData = [
  { name: "Dr. Muller", gkv: 18500, pkv: 8200, igel: 3800, avg: 30500 },
  { name: "Dr. Schmidt", gkv: 16200, pkv: 6800, igel: 2500, avg: 25500 },
  { name: "Dr. Weber", gkv: 14800, pkv: 5500, igel: 1900, avg: 22200 },
  { name: "Dr. Fischer", gkv: 12500, pkv: 4200, igel: 1200, avg: 17900 },
]

export function RevenuePerDoctorChart() {
  const totalRevenue = revenuePerDocData.reduce((s, d) => s + d.gkv + d.pkv + d.igel, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Umsatz pro Behandler</CardTitle>
            <CardDescription>Monatsumsatz aufgeteilt nach Leistungsart</CardDescription>
          </div>
          <Badge variant="outline">{formatEuro(totalRevenue)} gesamt</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={revenuePerDocData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="name" className="text-xs" width={90} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatEuro(v)} />
            <Legend />
            <Bar dataKey="gkv" name="GKV" stackId="a" fill={COLORS.primary} />
            <Bar dataKey="pkv" name="PKV" stackId="a" fill={COLORS.secondary} />
            <Bar dataKey="igel" name="IGeL" stackId="a" fill={COLORS.tertiary} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ── 12. Seasonal Patterns ──

const seasonalData = [
  { month: "Jan", current: 380, avg3y: 365, index: 95 },
  { month: "Feb", current: 395, avg3y: 380, index: 98 },
  { month: "Mär", current: 420, avg3y: 405, index: 108 },
  { month: "Apr", current: 405, avg3y: 390, index: 102 },
  { month: "Mai", current: 390, avg3y: 375, index: 97 },
  { month: "Jun", current: 415, avg3y: 395, index: 103 },
  { month: "Jul", current: 340, avg3y: 350, index: 88 },
  { month: "Aug", current: 310, avg3y: 325, index: 80 },
  { month: "Sep", current: 430, avg3y: 410, index: 110 },
  { month: "Okt", current: 445, avg3y: 425, index: 113 },
  { month: "Nov", current: 435, avg3y: 420, index: 111 },
  { month: "Dez", current: 370, avg3y: 360, index: 92 },
]

export function SeasonalPatternsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Saisonale Muster</CardTitle>
        <CardDescription>Patientenaufkommen: aktuell vs. 3-Jahres-Durchschnitt mit Saisonindex</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={seasonalData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis yAxisId="left" className="text-xs" />
            <YAxis yAxisId="right" orientation="right" className="text-xs" domain={[70, 120]} tickFormatter={(v) => `${v}`} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="current" name="Aktuell" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 3 }} />
            <Line yAxisId="left" type="monotone" dataKey="avg3y" name="3J-Durchschnitt" stroke={COLORS.muted} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            <Area yAxisId="right" type="monotone" dataKey="index" name="Saisonindex" stroke={COLORS.tertiary} fill={COLORS.tertiary} fillOpacity={0.1} strokeWidth={1} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ── 13. Insurance Mix ──

const insuranceData = [
  { name: "GKV", patients: 72, revenue: 55 },
  { name: "PKV", patients: 18, revenue: 32 },
  { name: "Selbstzahler", patients: 7, revenue: 10 },
  { name: "BG/Sonstige", patients: 3, revenue: 3 },
]

export function InsuranceMixChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kassenart-Verteilung</CardTitle>
        <CardDescription>Patientenanteil vs. Umsatzanteil nach Versicherungsart</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <p className="text-xs text-muted-foreground text-center mb-2 font-medium">Patientenanteil</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={insuranceData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="patients">
                  {insuranceData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-xs text-muted-foreground text-center mb-2 font-medium">Umsatzanteil</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={insuranceData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="revenue">
                  {insuranceData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex justify-center gap-4 mt-2">
          {insuranceData.map((item, i) => (
            <div key={item.name} className="flex items-center gap-1.5 text-xs">
              <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── 14. Employee Absence ──

const absenceData = [
  { month: "Jan", krank: 8, urlaub: 5, fortbildung: 2 },
  { month: "Feb", krank: 6, urlaub: 3, fortbildung: 1 },
  { month: "Mär", krank: 10, urlaub: 4, fortbildung: 3 },
  { month: "Apr", krank: 4, urlaub: 12, fortbildung: 2 },
  { month: "Mai", krank: 3, urlaub: 8, fortbildung: 1 },
  { month: "Jun", krank: 5, urlaub: 15, fortbildung: 0 },
  { month: "Jul", krank: 2, urlaub: 22, fortbildung: 0 },
  { month: "Aug", krank: 3, urlaub: 25, fortbildung: 0 },
  { month: "Sep", krank: 7, urlaub: 6, fortbildung: 2 },
  { month: "Okt", krank: 9, urlaub: 8, fortbildung: 1 },
  { month: "Nov", krank: 12, urlaub: 3, fortbildung: 2 },
  { month: "Dez", krank: 8, urlaub: 18, fortbildung: 1 },
]

export function EmployeeAbsenceChart() {
  const totalSick = absenceData.reduce((s, d) => s + d.krank, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Abwesenheiten & Kranktage</CardTitle>
            <CardDescription>Ausfallzeiten nach Kategorie und Monat (Team gesamt)</CardDescription>
          </div>
          <Badge variant={totalSick > 80 ? "destructive" : "secondary"}>{totalSick} Kranktage/Jahr</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={absenceData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis className="text-xs" label={{ value: "Tage", angle: -90, position: "insideLeft", className: "text-xs fill-muted-foreground" }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v} Tage`} />
            <Legend />
            <Bar dataKey="krank" name="Krankheit" stackId="a" fill={COLORS.quaternary} />
            <Bar dataKey="urlaub" name="Urlaub" stackId="a" fill={COLORS.primary} />
            <Bar dataKey="fortbildung" name="Fortbildung" stackId="a" fill={COLORS.sixth} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ── 15. Patient Satisfaction ──

const satisfactionData = [
  { month: "Jan", google: 4.2, jameda: 1.8, index: 78 },
  { month: "Feb", google: 4.3, jameda: 1.7, index: 80 },
  { month: "Mär", google: 4.1, jameda: 1.9, index: 76 },
  { month: "Apr", google: 4.4, jameda: 1.6, index: 82 },
  { month: "Mai", google: 4.3, jameda: 1.7, index: 80 },
  { month: "Jun", google: 4.5, jameda: 1.5, index: 85 },
  { month: "Jul", google: 4.4, jameda: 1.6, index: 83 },
  { month: "Aug", google: 4.3, jameda: 1.7, index: 81 },
  { month: "Sep", google: 4.6, jameda: 1.4, index: 87 },
  { month: "Okt", google: 4.5, jameda: 1.5, index: 86 },
  { month: "Nov", google: 4.6, jameda: 1.4, index: 88 },
  { month: "Dez", google: 4.5, jameda: 1.5, index: 85 },
]

export function PatientSatisfactionChart() {
  const latestIndex = satisfactionData[satisfactionData.length - 1].index

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Patientenzufriedenheit</CardTitle>
            <CardDescription>Google-Bewertung, Jameda-Note und Zufriedenheitsindex</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
              <TrendingUp className="h-3 w-3" />Index: {latestIndex}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={satisfactionData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis yAxisId="left" className="text-xs" domain={[3, 5]} />
            <YAxis yAxisId="right" orientation="right" className="text-xs" domain={[60, 100]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="google" name="Google (1-5)" stroke={COLORS.tertiary} strokeWidth={2} dot={{ r: 3 }} />
            <Line yAxisId="left" type="monotone" dataKey="jameda" name="Jameda (1-6, niedrig=gut)" stroke={COLORS.secondary} strokeWidth={2} dot={{ r: 3 }} />
            <Area yAxisId="right" type="monotone" dataKey="index" name="Zufriedenheitsindex" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.08} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ── 16. Capacity Utilization ──

const capacityData = [
  { room: "Sprechzimmer 1", vormittag: 92, nachmittag: 85 },
  { room: "Sprechzimmer 2", vormittag: 88, nachmittag: 78 },
  { room: "Behandlungsraum", vormittag: 75, nachmittag: 65 },
  { room: "EKG-Raum", vormittag: 45, nachmittag: 30 },
  { room: "Sonografie", vormittag: 60, nachmittag: 50 },
  { room: "Labor", vormittag: 95, nachmittag: 70 },
]

export function CapacityUtilizationChart() {
  const avgUtil = Math.round(capacityData.reduce((s, d) => s + d.vormittag + d.nachmittag, 0) / (capacityData.length * 2))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Kapazitatsauslastung</CardTitle>
            <CardDescription>Raumauslastung vormittags vs. nachmittags</CardDescription>
          </div>
          <Badge variant={avgUtil > 75 ? "default" : "secondary"}>{avgUtil}% gesamt</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={capacityData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="room" className="text-xs" width={110} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v}%`} />
            <Legend />
            <Bar dataKey="vormittag" name="Vormittag" fill={COLORS.primary} barSize={14} radius={[0, 4, 4, 0]} />
            <Bar dataKey="nachmittag" name="Nachmittag" fill={COLORS.sixth} barSize={14} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
