"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ClipboardList, Clock, ExternalLink, FolderOpen } from "lucide-react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase/client"

interface Responsibility {
  id: string
  name: string
  description?: string
  category?: string
  responsible_user_id?: string
  responsible_user_name?: string
  suggested_hours_per_week?: number
  status?: string
  priority?: string
  created_at?: string
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
      const { data, error: fetchError } = await supabase
        .from("responsibilities")
        .select("*")
        .eq("practice_id", practiceId)
        .eq("responsible_user_id", memberId)
        .is("deleted_at", null)
        .order("name")

      if (fetchError) throw fetchError

      setResponsibilities(data || [])
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

  const totalHours = responsibilities.reduce((sum, r) => sum + (r.suggested_hours_per_week || 0), 0)

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
              {responsibilities.length} Verantwortungsbereich{responsibilities.length !== 1 ? "e" : ""} zugewiesen
              {totalHours > 0 && ` • ${totalHours.toFixed(1)}h/Woche gesamt`}
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
              const categoryColor = getCategoryColor(responsibility.category)

              return (
                <div
                  key={responsibility.id}
                  className={`group relative rounded-lg border p-4 transition-all hover:shadow-md cursor-pointer ${categoryColor.border} ${categoryColor.bg}`}
                  onClick={() => router.push("/responsibilities")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2">{responsibility.name}</h4>

                      {responsibility.category && (
                        <Badge
                          variant="outline"
                          className={`mt-2 text-xs ${categoryColor.text} ${categoryColor.border}`}
                        >
                          {responsibility.category}
                        </Badge>
                      )}

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
