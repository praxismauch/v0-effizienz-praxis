"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ClipboardList, Clock, ExternalLink, FolderOpen, Users, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

interface Responsibility {
  id: string
  name: string
  description?: string
  category?: string
  group_name?: string
  responsible_user_id?: string
  responsible_user_name?: string
  deputy_user_id?: string
  deputy_user_name?: string
  team_member_ids?: string[]
  assigned_teams?: string[]
  suggested_hours_per_week?: number
  status?: string
  priority?: string
  created_at?: string
  assignment_type?: "direct" | "team_member" | "team" | "deputy"
  assignment_team_name?: string
}

interface Team {
  id: string
  name: string
  color: string
}

interface TeamMemberResponsibilitiesTabProps {
  memberId: string
  practiceId: string
  memberName: string
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Patientenversorgung: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Administration: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  Qualitätsmanagement: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  Personal: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  "IT & Technik": { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  Hygiene: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
  Finanzen: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Marketing: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
}

const DEFAULT_COLOR = { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" }

export function TeamMemberResponsibilitiesTab({
  memberId,
  practiceId,
  memberName,
}: TeamMemberResponsibilitiesTabProps) {
  const router = useRouter()
  const [responsibilities, setResponsibilities] = useState<Responsibility[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedRef = useRef(false)

  const loadResponsibilities = useCallback(async () => {
    if (!practiceId || !memberId) {
      setLoading(false)
      return
    }

    if (hasLoadedRef.current) return
    hasLoadedRef.current = true

    try {
      setLoading(true)
      setError(null)

      const supabase = createBrowserSupabaseClient()

      // team_assignments.user_id = auth.users.id, NOT team_members.id
      const { data: teamMemberData } = await supabase.from("team_members").select("user_id").eq("id", memberId).single()

      const authUserId = teamMemberData?.user_id

      let memberTeamIds: string[] = []
      const teamsMap = new Map<string, Team>()

      if (authUserId) {
        const { data: teamAssignments } = await supabase
          .from("team_assignments")
          .select("team_id, teams(id, name, color)")
          .eq("user_id", authUserId)

        memberTeamIds = teamAssignments?.map((ta: any) => ta.team_id) || []
        teamAssignments?.forEach((ta: any) => {
          if (ta.teams) {
            teamsMap.set(ta.teams.id, ta.teams)
          }
        })
      }

      const { data: allResponsibilities, error: fetchError } = await supabase
        .from("responsibilities")
        .select("*")
        .eq("practice_id", practiceId)
        .is("deleted_at", null)
        .order("name")

      if (fetchError) throw fetchError

      const filteredResponsibilities: Responsibility[] = []
      const addedIds = new Set<string>()

      for (const resp of allResponsibilities || []) {
        // Direct responsibility (Hauptverantwortlicher)
        if (resp.responsible_user_id === memberId && !addedIds.has(resp.id)) {
          filteredResponsibilities.push({ ...resp, assignment_type: "direct" })
          addedIds.add(resp.id)
          continue
        }

        // Deputy responsibility (Stellvertreter)
        if (resp.deputy_user_id === memberId && !addedIds.has(resp.id)) {
          filteredResponsibilities.push({ ...resp, assignment_type: "deputy" })
          addedIds.add(resp.id)
          continue
        }

        // In team_member_ids array
        if (resp.team_member_ids?.includes(memberId) && !addedIds.has(resp.id)) {
          filteredResponsibilities.push({ ...resp, assignment_type: "team_member" })
          addedIds.add(resp.id)
          continue
        }

        // Via team assignment (assigned_teams contains a team the member belongs to)
        if (resp.assigned_teams && resp.assigned_teams.length > 0 && memberTeamIds.length > 0) {
          const matchingTeamId = resp.assigned_teams.find((teamId: string) => memberTeamIds.includes(teamId))
          if (matchingTeamId && !addedIds.has(resp.id)) {
            const team = teamsMap.get(matchingTeamId)
            filteredResponsibilities.push({
              ...resp,
              assignment_type: "team",
              assignment_team_name: team?.name || "Team",
            })
            addedIds.add(resp.id)
          }
        }
      }

      setResponsibilities(filteredResponsibilities)
    } catch (err) {
      console.error("Error loading responsibilities:", err)
      setError("Fehler beim Laden der Zuständigkeiten")
    } finally {
      setLoading(false)
    }
  }, [practiceId, memberId])

  useEffect(() => {
    loadResponsibilities()
  }, [loadResponsibilities])

  const getCategoryColor = (category?: string) => {
    if (!category) return DEFAULT_COLOR
    return CATEGORY_COLORS[category] || DEFAULT_COLOR
  }

  const getAssignmentBadge = (responsibility: Responsibility) => {
    switch (responsibility.assignment_type) {
      case "direct":
        return (
          <Badge variant="default" className="text-xs bg-primary/90">
            <User className="h-3 w-3 mr-1" />
            Hauptverantwortlich
          </Badge>
        )
      case "deputy":
        return (
          <Badge variant="secondary" className="text-xs">
            <User className="h-3 w-3 mr-1" />
            Stellvertreter
          </Badge>
        )
      case "team_member":
        return (
          <Badge variant="outline" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            Teammitglied
          </Badge>
        )
      case "team":
        return (
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            <Users className="h-3 w-3 mr-1" />
            via {responsibility.assignment_team_name}
          </Badge>
        )
      default:
        return null
    }
  }

  const totalHours = responsibilities.reduce((sum, r) => sum + (r.suggested_hours_per_week || 0), 0)

  const directCount = responsibilities.filter((r) => r.assignment_type === "direct").length
  const deputyCount = responsibilities.filter((r) => r.assignment_type === "deputy").length
  const teamCount = responsibilities.filter(
    (r) => r.assignment_type === "team" || r.assignment_type === "team_member",
  ).length

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Zuständigkeiten
          </CardTitle>
          <CardDescription>Verantwortungsbereiche von {memberName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Zuständigkeiten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-destructive">
            <p>{error}</p>
            <Button
              variant="outline"
              className="mt-4 bg-transparent"
              onClick={() => {
                hasLoadedRef.current = false
                loadResponsibilities()
              }}
            >
              Erneut versuchen
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Zuständigkeiten
            </CardTitle>
            <CardDescription>
              {responsibilities.length} Verantwortungsbereich{responsibilities.length !== 1 ? "e" : ""}
              {directCount > 0 && ` • ${directCount} direkt`}
              {deputyCount > 0 && ` • ${deputyCount} Stv.`}
              {teamCount > 0 && ` • ${teamCount} via Team`}
              {totalHours > 0 && ` • ${totalHours.toFixed(1)}h/Woche`}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push("/responsibilities")}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Alle anzeigen
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {responsibilities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">Keine Zuständigkeiten zugewiesen</p>
            <p className="text-sm mt-1">{memberName} hat noch keine Verantwortungsbereiche zugewiesen bekommen.</p>
            <Button variant="outline" className="mt-4 bg-transparent" onClick={() => router.push("/responsibilities")}>
              Zur Zuständigkeitsverwaltung
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {responsibilities.map((responsibility) => {
              const categoryColor = getCategoryColor(responsibility.category || responsibility.group_name)

              return (
                <div
                  key={responsibility.id}
                  className={`group relative rounded-lg border p-4 transition-all hover:shadow-md cursor-pointer ${categoryColor.border} ${categoryColor.bg}`}
                  onClick={() => router.push("/responsibilities")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2">{responsibility.name}</h4>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {getAssignmentBadge(responsibility)}
                        {(responsibility.category || responsibility.group_name) && (
                          <Badge variant="outline" className={`text-xs ${categoryColor.text} ${categoryColor.border}`}>
                            {responsibility.category || responsibility.group_name}
                          </Badge>
                        )}
                      </div>

                      {responsibility.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{responsibility.description}</p>
                      )}
                    </div>

                    {responsibility.suggested_hours_per_week !== undefined &&
                      responsibility.suggested_hours_per_week > 0 && (
                        <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" />
                          {responsibility.suggested_hours_per_week}h/W
                        </Badge>
                      )}
                  </div>

                  {responsibility.priority && (
                    <div className="mt-3 pt-3 border-t border-dashed">
                      <Badge
                        variant={
                          responsibility.priority === "high"
                            ? "destructive"
                            : responsibility.priority === "medium"
                              ? "default"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {responsibility.priority === "high"
                          ? "Hohe Priorität"
                          : responsibility.priority === "medium"
                            ? "Mittlere Priorität"
                            : "Niedrige Priorität"}
                      </Badge>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
