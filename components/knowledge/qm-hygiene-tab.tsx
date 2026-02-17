"use client"

import { useMemo } from "react"
import useSWR from "swr"
import { usePractice } from "@/contexts/practice-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  FileWarning,
} from "lucide-react"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => { if (!r.ok) throw new Error("Fetch failed"); return r.json() })

interface HygienePlan {
  id: string
  title: string
  description: string
  category: string
  area?: string
  frequency: string
  status: string
  ai_generated: boolean
  created_at: string
  updated_at?: string
}

const frequencyLabels: Record<string, string> = {
  daily: "Taglich",
  weekly: "Wochentlich",
  monthly: "Monatlich",
  quarterly: "Quartalsweise",
  yearly: "Jahrlich",
  as_needed: "Bei Bedarf",
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
  active: { label: "Aktiv", variant: "default", icon: CheckCircle2 },
  draft: { label: "Entwurf", variant: "secondary", icon: Clock },
  archived: { label: "Archiviert", variant: "outline", icon: FileWarning },
  review: { label: "Pruefung", variant: "destructive", icon: AlertTriangle },
}

export function QmHygieneTab() {
  const { currentPractice } = usePractice()
  const practiceId = currentPractice?.id

  const { data, isLoading } = useSWR(
    practiceId ? `/api/practices/${practiceId}/hygiene-plans` : null,
    fetcher,
    { refreshInterval: 60000 }
  )

  const plans: HygienePlan[] = data?.hygienePlans || []

  const activePlans = useMemo(() => plans.filter((p) => p.status === "active"), [plans])
  const draftPlans = useMemo(() => plans.filter((p) => p.status === "draft"), [plans])

  const categoryGroups = useMemo(() => {
    const groups: Record<string, HygienePlan[]> = {}
    for (const plan of activePlans) {
      const cat = plan.category || plan.area || "Sonstige"
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(plan)
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
  }, [activePlans])

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (plans.length === 0) {
    return (
      <Card className="p-12 text-center">
        <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Keine Hygieneplane vorhanden</h3>
        <p className="text-muted-foreground mb-4">
          Erstellen Sie RKI-konforme Hygieneplane in der Hygieneplan-Verwaltung.
        </p>
        <Link href="/hygieneplan">
          <Button variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Zur Hygieneplan-Verwaltung
          </Button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header summary */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {activePlans.length} aktive Plane, {draftPlans.length} Entwurfe
          </p>
        </div>
        <Link href="/hygieneplan">
          <Button variant="outline" size="sm" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Alle Plane verwalten
          </Button>
        </Link>
      </div>

      {/* Category groups */}
      {categoryGroups.map(([category, categoryPlans]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            {category}
          </h3>
          <div className="grid gap-3">
            {categoryPlans.map((plan) => {
              const status = statusConfig[plan.status] || statusConfig.draft
              const StatusIcon = status.icon
              return (
                <Card key={plan.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium truncate">{plan.title}</h4>
                          {plan.ai_generated && (
                            <Sparkles className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                          )}
                        </div>
                        {plan.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {plan.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {frequencyLabels[plan.frequency] || plan.frequency}
                          </span>
                        </div>
                      </div>
                      <Badge variant={status.variant} className="shrink-0 gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}

      {/* Draft plans */}
      {draftPlans.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Entwurfe
          </h3>
          <div className="grid gap-3">
            {draftPlans.map((plan) => (
              <Card key={plan.id} className="opacity-70 hover:opacity-100 transition-opacity">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium truncate">{plan.title}</h4>
                      {plan.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {plan.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="shrink-0">Entwurf</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
