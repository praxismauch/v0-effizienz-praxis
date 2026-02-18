"use client"

import { useMemo } from "react"
import useSWR from "swr"
import { usePractice } from "@/contexts/practice-context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import {
  GraduationCap,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Award,
  Users,
  Calendar,
} from "lucide-react"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((r) => { if (!r.ok) throw new Error("Fetch failed"); return r.json() })

interface Certification {
  id: string
  name: string
  description?: string
  category: string
  issuing_authority?: string
  validity_months?: number
  is_mandatory: boolean
  color?: string
  created_at: string
}

interface TeamMemberCert {
  id: string
  certification_id: string
  team_member_id: string
  obtained_date: string
  expiry_date?: string
  status: string
}

export function QmTrainingTab() {
  const { currentPractice } = usePractice()
  const practiceId = currentPractice?.id

  const { data: certsData, isLoading: certsLoading } = useSWR(
    practiceId ? `/api/practices/${practiceId}/training/certifications` : null,
    fetcher,
    { refreshInterval: 60000 }
  )

  const { data: teamCertsData, isLoading: teamCertsLoading } = useSWR(
    practiceId ? `/api/practices/${practiceId}/training/team-member-certifications` : null,
    fetcher,
    { refreshInterval: 60000 }
  )

  const { data: teamData } = useSWR(
    practiceId ? `/api/practices/${practiceId}/team` : null,
    fetcher,
    { refreshInterval: 60000 }
  )

  const certifications: Certification[] = certsData?.certifications || []
  const teamCerts: TeamMemberCert[] = teamCertsData?.certifications || teamCertsData?.data || []
  const teamMembers = teamData?.members || teamData || []
  const teamCount = Array.isArray(teamMembers) ? teamMembers.length : 0

  const isLoading = certsLoading || teamCertsLoading

  // Build cert stats
  const certStats = useMemo(() => {
    const stats: Record<string, { valid: number; expired: number; total: number }> = {}
    for (const tc of teamCerts) {
      if (!stats[tc.certification_id]) stats[tc.certification_id] = { valid: 0, expired: 0, total: 0 }
      stats[tc.certification_id].total++
      const isExpired = tc.expiry_date && new Date(tc.expiry_date) < new Date()
      if (tc.status === "active" && !isExpired) {
        stats[tc.certification_id].valid++
      } else {
        stats[tc.certification_id].expired++
      }
    }
    return stats
  }, [teamCerts])

  // Overall summary
  const summary = useMemo(() => {
    let mandatoryCount = 0
    let mandatoryCompliant = 0
    let totalExpired = 0
    for (const cert of certifications) {
      const s = certStats[cert.id]
      if (cert.is_mandatory) {
        mandatoryCount++
        if (s && s.valid >= teamCount && teamCount > 0) mandatoryCompliant++
      }
      if (s) totalExpired += s.expired
    }
    return {
      mandatoryCount,
      mandatoryCompliant,
      complianceRate: mandatoryCount > 0 ? Math.round((mandatoryCompliant / mandatoryCount) * 100) : 100,
      totalExpired,
    }
  }, [certifications, certStats, teamCount])

  // Separate mandatory vs optional
  const mandatoryCerts = useMemo(
    () => certifications.filter((c) => c.is_mandatory),
    [certifications]
  )
  const optionalCerts = useMemo(
    () => certifications.filter((c) => !c.is_mandatory),
    [certifications]
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (certifications.length === 0) {
    return (
      <Card className="p-12 text-center">
        <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Keine Schulungsnachweise vorhanden</h3>
        <p className="text-muted-foreground mb-4">
          Verwalten Sie Schulungen und Zertifizierungen in der Fortbildungsverwaltung.
        </p>
        <Link href="/training">
          <Button variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Zur Fortbildungsverwaltung
          </Button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Compliance summary */}
      <Card className={`border-l-4 ${summary.complianceRate === 100 ? "border-l-emerald-500" : summary.complianceRate >= 70 ? "border-l-amber-500" : "border-l-red-500"}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold">Schulungs-Compliance</h3>
              <p className="text-sm text-muted-foreground">
                {summary.mandatoryCompliant} von {summary.mandatoryCount} Pflichtschulungen vollstandig
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${summary.complianceRate === 100 ? "text-emerald-600" : summary.complianceRate >= 70 ? "text-amber-600" : "text-red-600"}`}>
                {summary.complianceRate}%
              </span>
              <Link href="/training">
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Verwalten
                </Button>
              </Link>
            </div>
          </div>
          <Progress
            value={summary.complianceRate}
            className="h-2"
          />
          {summary.totalExpired > 0 && (
            <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
              <AlertTriangle className="h-4 w-4" />
              {summary.totalExpired} abgelaufene Zertifizierungen
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mandatory certifications */}
      {mandatoryCerts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Award className="h-4 w-4" />
            Pflichtschulungen ({mandatoryCerts.length})
          </h3>
          <div className="grid gap-3">
            {mandatoryCerts.map((cert) => {
              const stats = certStats[cert.id] || { valid: 0, expired: 0, total: 0 }
              const coverage = teamCount > 0 ? Math.round((stats.valid / teamCount) * 100) : 0
              const isCompliant = stats.valid >= teamCount && teamCount > 0
              return (
                <Card key={cert.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{cert.name}</h4>
                          <Badge variant="outline" className="text-xs">Pflicht</Badge>
                        </div>
                        {cert.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{cert.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {stats.valid}/{teamCount} eingewiesen
                          </div>
                          {cert.validity_months && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              Gultig: {cert.validity_months} Monate
                            </div>
                          )}
                          {stats.expired > 0 && (
                            <div className="flex items-center gap-1 text-xs text-red-600">
                              <AlertTriangle className="h-3 w-3" />
                              {stats.expired} abgelaufen
                            </div>
                          )}
                        </div>
                        <div className="mt-2">
                          <Progress value={coverage} className="h-1.5" />
                        </div>
                      </div>
                      {isCompliant ? (
                        <Badge variant="default" className="shrink-0 gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" />
                          Komplett
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="shrink-0 gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Unvollständig
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Optional certifications */}
      {optionalCerts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Optionale Schulungen ({optionalCerts.length})
          </h3>
          <div className="grid gap-3">
            {optionalCerts.map((cert) => {
              const stats = certStats[cert.id] || { valid: 0, expired: 0, total: 0 }
              return (
                <Card key={cert.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium">{cert.name}</h4>
                        {cert.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{cert.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {stats.valid} Teilnehmer
                          </span>
                          {cert.issuing_authority && (
                            <span>{cert.issuing_authority}</span>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {stats.total} Nachweise
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
