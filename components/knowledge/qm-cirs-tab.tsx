"use client"

import { useMemo } from "react"
import useSWR from "swr"
import { usePractice } from "@/contexts/practice-context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ShieldAlert,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  ArrowRight,
  TrendingDown,
} from "lucide-react"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => { if (!r.ok) throw new Error("Fetch failed"); return r.json() })

interface CirsIncident {
  id: string
  title: string
  description: string
  incident_type: string
  severity: string
  category: string
  status: string
  is_anonymous: boolean
  created_at: string
  reporter_name?: string
}

const severityConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  critical: { label: "Kritisch", color: "text-red-700", bgColor: "bg-red-500/10 border-red-200" },
  high: { label: "Hoch", color: "text-orange-700", bgColor: "bg-orange-500/10 border-orange-200" },
  medium: { label: "Mittel", color: "text-amber-700", bgColor: "bg-amber-500/10 border-amber-200" },
  low: { label: "Niedrig", color: "text-green-700", bgColor: "bg-green-500/10 border-green-200" },
}

const statusLabels: Record<string, string> = {
  submitted: "Eingereicht",
  in_review: "In Prüfung",
  resolved: "Gelöst",
  closed: "Geschlossen",
  open: "Offen",
}

export function QmCirsTab() {
  const { currentPractice } = usePractice()
  const practiceId = currentPractice?.id

  const { data, isLoading } = useSWR(
    practiceId ? `/api/practices/${practiceId}/cirs` : null,
    fetcher,
    { refreshInterval: 60000 }
  )

  const incidents: CirsIncident[] = data?.incidents || []

  const summary = useMemo(() => {
    const open = incidents.filter((i) => ["submitted", "in_review", "open"].includes(i.status))
    const resolved = incidents.filter((i) => ["resolved", "closed"].includes(i.status))
    const critical = incidents.filter((i) => i.severity === "critical" || i.severity === "high")
    const openCritical = open.filter((i) => i.severity === "critical" || i.severity === "high")

    // Category distribution
    const categories: Record<string, number> = {}
    for (const inc of incidents) {
      const cat = inc.category || "Sonstige"
      categories[cat] = (categories[cat] || 0) + 1
    }

    return {
      total: incidents.length,
      open: open.length,
      resolved: resolved.length,
      critical: critical.length,
      openCritical: openCritical.length,
      categories: Object.entries(categories).sort(([, a], [, b]) => b - a),
    }
  }, [incidents])

  // Recent incidents (last 10)
  const recentIncidents = useMemo(
    () => incidents.slice(0, 10),
    [incidents]
  )

  // Open incidents sorted by severity
  const openIncidents = useMemo(() => {
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
    return incidents
      .filter((i) => ["submitted", "in_review", "open"].includes(i.status))
      .sort((a, b) => (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9))
  }, [incidents])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (incidents.length === 0) {
    return (
      <Card className="p-12 text-center">
        <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Keine CIRS-Meldungen vorhanden</h3>
        <p className="text-muted-foreground mb-4">
          Melden Sie Vorfälle und Beinahe-Fehler im CIRS-System.
        </p>
        <Link href="/cirs">
          <Button variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Zum CIRS-System
          </Button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Gesamt</span>
          </div>
          <p className="text-xl font-bold">{summary.total}</p>
        </Card>
        <Card className={`p-3 ${summary.openCritical > 0 ? "border-red-200 bg-red-50/50 dark:bg-red-950/20" : ""}`}>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-xs text-muted-foreground">Offen</span>
          </div>
          <p className="text-xl font-bold">{summary.open}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs text-muted-foreground">Gelöst</span>
          </div>
          <p className="text-xl font-bold">{summary.resolved}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="h-4 w-4 text-red-600" />
            <span className="text-xs text-muted-foreground">Kritisch</span>
          </div>
          <p className="text-xl font-bold">{summary.critical}</p>
        </Card>
      </div>

      {/* Link to full CIRS */}
      <div className="flex justify-end">
        <Link href="/cirs">
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            CIRS-System offnen
          </Button>
        </Link>
      </div>

      {/* Open critical incidents first */}
      {openIncidents.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Offene Meldungen ({openIncidents.length})
          </h3>
          <div className="grid gap-3">
            {openIncidents.map((incident) => {
              const sev = severityConfig[incident.severity] || severityConfig.low
              return (
                <Card key={incident.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{incident.title}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{incident.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span>{incident.category}</span>
                          <span>{incident.incident_type === "error" ? "Fehler" : "Beinahe-Fehler"}</span>
                          <span>{new Date(incident.created_at).toLocaleDateString("de-DE")}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge variant="outline" className={`gap-1 ${sev.bgColor} ${sev.color}`}>
                          {sev.label}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {statusLabels[incident.status] || incident.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Top categories */}
      {summary.categories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Haufigste Kategorien
          </h3>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                {summary.categories.slice(0, 5).map(([cat, count]) => {
                  const pct = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-sm min-w-0 flex-1 truncate">{cat}</span>
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-right">{count} ({pct}%)</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
