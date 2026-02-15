"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Shield, ShieldAlert, ShieldCheck, ShieldX, RefreshCw, Activity, Globe, Bot } from "lucide-react"

interface SecurityAnalytics {
  totalRequests: number
  blockedRequests: number
  captchaRequests: number
  topIPs: Array<{ ip: string; count: number }>
  topEndpoints: Array<{ endpoint: string; count: number }>
  alerts: Array<{
    type: "high_frequency" | "multiple_endpoints" | "suspicious_ua" | "repeated_blocks"
    ip: string
    severity: "low" | "medium" | "high"
    details: string
    timestamp: number
  }>
}

const ALERT_TYPE_LABELS: Record<string, string> = {
  high_frequency: "Hohe Frequenz",
  multiple_endpoints: "Mehrere Endpunkte",
  suspicious_ua: "Verdachtiger User-Agent",
  repeated_blocks: "Wiederholte Blockierungen",
}

const SEVERITY_STYLES: Record<string, string> = {
  low: "bg-[var(--warning)]/10 text-[var(--warning)]",
  medium: "bg-[var(--chart-2)]/10 text-[var(--chart-2)]",
  high: "bg-[var(--destructive)]/10 text-[var(--destructive)]",
}

const SEVERITY_LABELS: Record<string, string> = {
  low: "Niedrig",
  medium: "Mittel",
  high: "Hoch",
}

export function SecurityDashboard() {
  const [analytics, setAnalytics] = useState<SecurityAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hours, setHours] = useState("24")
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnalytics = useCallback(async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/super-admin/security/analytics?hours=${hours}`)
      if (!response.ok) throw new Error("Fehler beim Laden der Sicherheitsdaten")
      const data = await response.json()
      setAnalytics(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [hours])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchAnalytics, 30000)
    return () => clearInterval(interval)
  }, [fetchAnalytics])

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-[var(--muted-foreground)]" />
        <span className="ml-2 text-[var(--muted-foreground)]">Sicherheitsdaten werden geladen...</span>
      </div>
    )
  }

  if (error && !analytics) {
    return (
      <Card className="border-[var(--destructive)]/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ShieldX className="h-12 w-12 text-[var(--destructive)] mb-4" />
          <p className="text-[var(--destructive)] font-medium">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchAnalytics}>
            Erneut versuchen
          </Button>
        </CardContent>
      </Card>
    )
  }

  const blockRate = analytics
    ? analytics.totalRequests > 0
      ? ((analytics.blockedRequests / analytics.totalRequests) * 100).toFixed(2)
      : "0.00"
    : "0.00"

  const highAlerts = analytics?.alerts.filter((a) => a.severity === "high").length || 0

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Sicherheits-Dashboard</h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            Echtzeit-Uberwachung der API-Sicherheit und Anomalieerkennung
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={hours} onValueChange={setHours}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Letzte Stunde</SelectItem>
              <SelectItem value="6">Letzte 6 Stunden</SelectItem>
              <SelectItem value="24">Letzte 24 Stunden</SelectItem>
              <SelectItem value="168">Letzte 7 Tage</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchAnalytics} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            <span className="sr-only">Aktualisieren</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
              Anfragen gesamt
            </CardTitle>
            <Activity className="h-4 w-4 text-[var(--muted-foreground)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {analytics?.totalRequests.toLocaleString("de-DE") || 0}
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Im ausgewahlten Zeitraum
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
              Blockiert
            </CardTitle>
            <ShieldX className="h-4 w-4 text-[var(--destructive)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--destructive)]">
              {analytics?.blockedRequests.toLocaleString("de-DE") || 0}
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              {blockRate}% der Anfragen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
              CAPTCHA-Herausforderungen
            </CardTitle>
            <Bot className="h-4 w-4 text-[var(--warning)]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[var(--foreground)]">
              {analytics?.captchaRequests.toLocaleString("de-DE") || 0}
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              Verifizierungen ausgelost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">
              Aktive Warnungen
            </CardTitle>
            {highAlerts > 0 ? (
              <ShieldAlert className="h-4 w-4 text-[var(--destructive)]" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-[var(--success)]" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${highAlerts > 0 ? "text-[var(--destructive)]" : "text-[var(--success)]"}`}>
              {analytics?.alerts.length || 0}
            </div>
            <p className="text-xs text-[var(--muted-foreground)]">
              {highAlerts > 0 ? `${highAlerts} kritische Warnung(en)` : "Keine kritischen Warnungen"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {analytics?.alerts && analytics.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
              <ShieldAlert className="h-5 w-5 text-[var(--destructive)]" />
              Aktive Sicherheitswarnungen
            </CardTitle>
            <CardDescription>Erkannte Anomalien und verdachtige Aktivitaten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {analytics.alerts.map((alert, idx) => (
                <div
                  key={`${alert.ip}-${alert.type}-${idx}`}
                  className="flex items-start justify-between rounded-lg border border-[var(--border)] p-4"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Badge className={SEVERITY_STYLES[alert.severity]}>
                        {SEVERITY_LABELS[alert.severity]}
                      </Badge>
                      <span className="text-sm font-medium text-[var(--foreground)]">
                        {ALERT_TYPE_LABELS[alert.type] || alert.type}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--muted-foreground)]">{alert.details}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      IP: <code className="rounded bg-[var(--muted)] px-1 py-0.5 font-mono text-xs">{alert.ip}</code>
                    </p>
                  </div>
                  <time className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">
                    {new Date(alert.timestamp).toLocaleString("de-DE")}
                  </time>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two Column Layout: Top IPs + Top Endpoints */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top IPs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
              <Globe className="h-5 w-5 text-[var(--primary)]" />
              Top IP-Adressen
            </CardTitle>
            <CardDescription>IPs mit den meisten Anfragen</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.topIPs && analytics.topIPs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP-Adresse</TableHead>
                    <TableHead className="text-right">Anfragen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topIPs.map((entry) => (
                    <TableRow key={entry.ip}>
                      <TableCell>
                        <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-sm">
                          {entry.ip}
                        </code>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {entry.count.toLocaleString("de-DE")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
                Keine Daten verfugbar
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
              <Shield className="h-5 w-5 text-[var(--primary)]" />
              Top Endpunkte
            </CardTitle>
            <CardDescription>Endpunkte mit dem meisten Traffic</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.topEndpoints && analytics.topEndpoints.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Endpunkt</TableHead>
                    <TableHead className="text-right">Anfragen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topEndpoints.map((entry) => (
                    <TableRow key={entry.endpoint}>
                      <TableCell>
                        <code className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-xs">
                          {entry.endpoint}
                        </code>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {entry.count.toLocaleString("de-DE")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
                Keine Daten verfugbar
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SecurityDashboard
