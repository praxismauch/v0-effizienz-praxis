"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ClipboardList, Clock, ExternalLink, FolderOpen, Users, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTeamMemberResponsibilities } from "@/hooks/use-team-data"

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

export default function TeamMemberResponsibilitiesTab({
  memberId,
  practiceId,
  memberName,
}: TeamMemberResponsibilitiesTabProps) {
  const router = useRouter()
  
  const { responsibilities, isLoading: loading, error: fetchError } = useTeamMemberResponsibilities(practiceId, memberId)
  
  const error = fetchError ? "Fehler beim Laden der Zuständigkeiten" : null

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

  const totalHours = responsibilities.reduce((sum: number, r: Responsibility) => sum + (r.suggested_hours_per_week || 0), 0)

  const directCount = responsibilities.filter((r: Responsibility) => r.assignment_type === "direct").length
  const deputyCount = responsibilities.filter((r: Responsibility) => r.assignment_type === "deputy").length
  const teamCount = responsibilities.filter(
    (r: Responsibility) => r.assignment_type === "team" || r.assignment_type === "team_member",
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
              onClick={() => window.location.reload()}
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
          <div className="space-y-6">
            {/* Hauptverantwortlich Section */}
            {responsibilities.filter((r: Responsibility) => r.assignment_type === "direct" || r.assignment_type === "team_member").length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Hauptverantwortlich
                  <Badge variant="secondary" className="ml-1">
                    {responsibilities.filter((r: Responsibility) => r.assignment_type === "direct" || r.assignment_type === "team_member").length}
                  </Badge>
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {responsibilities
                    .filter((r: Responsibility) => r.assignment_type === "direct" || r.assignment_type === "team_member")
                    .map((responsibility: Responsibility) => {
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
                            {responsibility.suggested_hours_per_week !== undefined && responsibility.suggested_hours_per_week > 0 && (
                              <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                                <Clock className="h-3 w-3" />
                                {responsibility.suggested_hours_per_week}h/W
                              </Badge>
                            )}
                          </div>
                          {responsibility.priority && (
                            <div className="mt-3 pt-3 border-t border-dashed">
                              <Badge
                                variant={responsibility.priority === "high" ? "destructive" : responsibility.priority === "medium" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {responsibility.priority === "high" ? "Hohe Priorität" : responsibility.priority === "medium" ? "Mittlere Priorität" : "Niedrige Priorität"}
                              </Badge>
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Stellvertreter Section */}
            {responsibilities.filter((r: Responsibility) => r.assignment_type === "deputy" || r.assignment_type === "team").length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Stellvertreter
                  <Badge variant="outline" className="ml-1">
                    {responsibilities.filter((r: Responsibility) => r.assignment_type === "deputy" || r.assignment_type === "team").length}
                  </Badge>
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {responsibilities
                    .filter((r: Responsibility) => r.assignment_type === "deputy" || r.assignment_type === "team")
                    .map((responsibility: Responsibility) => {
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
                            {responsibility.suggested_hours_per_week !== undefined && responsibility.suggested_hours_per_week > 0 && (
                              <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                                <Clock className="h-3 w-3" />
                                {responsibility.suggested_hours_per_week}h/W
                              </Badge>
                            )}
                          </div>
                          {responsibility.priority && (
                            <div className="mt-3 pt-3 border-t border-dashed">
                              <Badge
                                variant={responsibility.priority === "high" ? "destructive" : responsibility.priority === "medium" ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {responsibility.priority === "high" ? "Hohe Priorität" : responsibility.priority === "medium" ? "Mittlere Priorität" : "Niedrige Priorität"}
                              </Badge>
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { TeamMemberResponsibilitiesTab }
