"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, MapPin, Briefcase, TrendingUp, Lightbulb, Users, Loader2, Trash2, Eye, Edit, ImagePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { CreateCompetitorAnalysisDialog } from "./create-competitor-analysis-dialog"
import { EditCompetitorAnalysisDialog } from "./edit-competitor-analysis-dialog"
import { toast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface CompetitorAnalysis {
  id: string
  practice_id: string
  created_by: string
  location: string
  specialty: string
  radius_km: number
  additional_keywords: string[]
  title: string
  status: string
  summary: string
  market_overview: any
  competitors: any[]
  strengths_weaknesses: any
  opportunities: any[]
  threats: any[]
  recommendations: any[]
  pricing_comparison: any
  service_comparison: any
  online_presence: any
  patient_reviews_analysis: any
  ai_analysis: any
  created_at: string
  updated_at: string
}

export function CompetitorAnalysisManagement() {
  const { currentUser, loading: userLoading } = useUser()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const [analyses, setAnalyses] = useState<CompetitorAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editAnalysis, setEditAnalysis] = useState<CompetitorAnalysis | null>(null)
  const [deleteAnalysis, setDeleteAnalysis] = useState<CompetitorAnalysis | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [generatingImageFor, setGeneratingImageFor] = useState<string | null>(null)
  const router = useRouter()

  const loadAnalyses = useCallback(async () => {
    const practiceId = currentPractice?.id

    if (!practiceId) {
      toast({
        title: "Keine Praxis ausgewählt",
        description: "Bitte wählen Sie eine Praxis aus der Dropdown-Liste aus.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/practices/${practiceId}/competitor-analysis`)

      if (response.ok) {
        const data = await response.json()
        setAnalyses(data)
      } else {
        toast({
          title: "Fehler beim Laden",
          description: "Analysen konnten nicht geladen werden.",
          variant: "destructive",
        })
        setAnalyses([])
      }
    } catch (error) {
      console.error("Failed to load analyses:", error)
      toast({
        title: "Fehler",
        description: "Ein Fehler ist beim Laden der Analysen aufgetreten.",
        variant: "destructive",
      })
      setAnalyses([])
    } finally {
      setLoading(false)
    }
  }, [currentPractice?.id])

  useEffect(() => {
    if (userLoading || practiceLoading) {
      return
    }

    if (currentPractice?.id) {
      loadAnalyses()
    } else {
      setLoading(false)
    }
  }, [currentPractice?.id, userLoading, practiceLoading, loadAnalyses])

  const handleDelete = async () => {
    if (!deleteAnalysis || !currentPractice?.id) return

    const analysisToDelete = deleteAnalysis
    setDeleting(true)

    setAnalyses((prev) => prev.filter((a) => a.id !== analysisToDelete.id))
    setDeleteAnalysis(null)

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/competitor-analysis/${analysisToDelete.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        await loadAnalyses()
      }
    } catch (error) {
      console.error("Error deleting analysis:", error)
      await loadAnalyses()
    } finally {
      setDeleting(false)
    }
  }

  const handleGenerateImage = async (analysis: CompetitorAnalysis) => {
    if (!currentPractice?.id) return
    setGeneratingImageFor(analysis.id)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/competitor-analysis/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: analysis.id,
          location: analysis.location,
          specialty: analysis.specialty,
        }),
      })
      if (response.ok) {
        toast({ title: "Bild generiert", description: "Das Titelbild wurde erfolgreich erstellt." })
        await loadAnalyses()
      } else {
        const err = await response.json().catch(() => ({}))
        toast({ title: "Fehler", description: err.error || "Bild konnte nicht generiert werden", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error generating image:", error)
      toast({ title: "Fehler", description: "Bild konnte nicht generiert werden", variant: "destructive" })
    } finally {
      setGeneratingImageFor(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Abgeschlossen</Badge>
        )
      case "generating":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Wird generiert...</Badge>
        )
      case "error":
        return <Badge variant="destructive">Fehler</Badge>
      default:
        return <Badge variant="secondary">Entwurf</Badge>
    }
  }

  const getCompetitorCount = (analysis: CompetitorAnalysis) => {
    return analysis.competitors?.length || 0
  }

  const getRecommendationCount = (analysis: CompetitorAnalysis) => {
    return analysis.recommendations?.length || 0
  }

  const getCompetitiveGradient = (analysis: CompetitorAnalysis) => {
    const competitorCount = getCompetitorCount(analysis)
    if (competitorCount === 0) return "from-green-50 to-emerald-50"
    if (competitorCount <= 3) return "from-blue-50 to-cyan-50"
    if (competitorCount <= 6) return "from-yellow-50 to-orange-50"
    return "from-red-50 to-pink-50"
  }

  const getCompetitiveIntensity = (analysis: CompetitorAnalysis) => {
    const competitorCount = getCompetitorCount(analysis)
    if (competitorCount === 0) return { label: "Exzellent", color: "text-green-600", intensity: 5 }
    if (competitorCount <= 3) return { label: "Günstig", color: "text-blue-600", intensity: 4 }
    if (competitorCount <= 6) return { label: "Moderat", color: "text-yellow-600", intensity: 3 }
    return { label: "Intensiv", color: "text-red-600", intensity: 2 }
  }

  if (loading || userLoading || practiceLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
  
      {/* Professional info card - blue design matching Selbstzahler-Analyse */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">KI-gestützte Wettbewerbsanalyse</CardTitle>
            </div>
            <Button onClick={() => setCreateOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Neue Analyse
            </Button>
          </div>
          <CardDescription>
            Finden Sie heraus, wie Sie sich im regionalen Wettbewerb optimal positionieren
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-background rounded">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Regionale Analyse</h4>
                <p className="text-xs text-muted-foreground">Wettbewerber in Ihrer Umgebung identifizieren</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-background rounded">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Marktchancen</h4>
                <p className="text-xs text-muted-foreground">Ungenutzte Potenziale und Nischen entdecken</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-background rounded">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Strategische Empfehlungen</h4>
                <p className="text-xs text-muted-foreground">KI-gestützte Handlungsempfehlungen</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analyses List */}
      {analyses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Noch keine Analysen vorhanden</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Starten Sie Ihre erste Konkurrenzanalyse, um Ihre Wettbewerber und Marktchancen zu entdecken
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Erste Analyse erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {analyses.map((analysis) => {
            const intensity = getCompetitiveIntensity(analysis)

            return (
              <Card
                key={analysis.id}
                className="hover:shadow-lg transition-all duration-300 group overflow-hidden relative"
              >
                {/* Visual header with gradient background and illustration */}
                <div className="relative h-36 overflow-hidden border-b">
                  {/* AI-generated image if available, otherwise styled gradient placeholder */}
                  {analysis.ai_analysis?.generated_image_url ? (
                    <img
                      src={analysis.ai_analysis.generated_image_url}
                      alt={`${analysis.location} - ${analysis.specialty}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Hide broken image, show gradient fallback
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                        const fallback = target.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = "flex"
                      }}
                    />
                  ) : null}
                  {/* Gradient placeholder (visible when no image or image fails) */}
                  <div
                    className={`absolute inset-0 flex flex-col items-center justify-center ${analysis.ai_analysis?.generated_image_url ? "hidden" : "flex"}`}
                    style={{
                      background: `linear-gradient(135deg, 
                        ${getCompetitorCount(analysis) > 6 ? "#fecaca 0%, #fca5a5 50%, #f87171 100%" :
                          getCompetitorCount(analysis) > 3 ? "#fef3c7 0%, #fde68a 50%, #fbbf24 100%" :
                          getCompetitorCount(analysis) > 0 ? "#dbeafe 0%, #93c5fd 50%, #3b82f6 100%" :
                          "#d1fae5 0%, #6ee7b7 50%, #10b981 100%"}`
                    }}
                  >
                    <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-3">
                      <MapPin className="h-8 w-8 text-white drop-shadow-sm" />
                    </div>
                    <p className="mt-2 text-xs font-medium text-white/90 drop-shadow-sm tracking-wide uppercase">
                      {analysis.location}
                    </p>
                  </div>

                  {/* Generate image button on placeholder */}
                  {!analysis.ai_analysis?.generated_image_url && analysis.status === "completed" && (
                    <button
                      className="absolute top-3 left-3 z-10 bg-white/80 backdrop-blur-sm hover:bg-white/95 rounded-lg p-1.5 shadow-sm transition-colors"
                      onClick={(e) => { e.stopPropagation(); handleGenerateImage(analysis) }}
                      disabled={generatingImageFor === analysis.id}
                      title="KI-Bild generieren"
                    >
                      {generatingImageFor === analysis.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <ImagePlus className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  )}

                  {/* Gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent pointer-events-none" />

                  {/* Status badge */}
                  <div className="absolute top-3 right-3 z-10">{getStatusBadge(analysis.status)}</div>

                  {/* Competitor count indicator */}
                  {analysis.status === "completed" && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
                      <div className="bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2 shadow-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{getCompetitorCount(analysis)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <CardHeader className="pb-3">
                  <CardTitle
                    className="text-lg line-clamp-2 min-h-[3.5rem] cursor-pointer hover:text-primary hover:underline transition-colors"
                    onClick={() => router.push(`/competitor-analysis/${analysis.id}`)}
                  >
                    {analysis.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{analysis.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Briefcase className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{analysis.specialty}</span>
                    </div>
                  </div>

                  {analysis.status === "completed" && (
                    <>
                      {/* Competitive intensity indicator */}
                      <div className="pt-3 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-muted-foreground">Wettbewerbsintensität</span>
                          <span className={`text-xs font-semibold ${intensity.color}`}>{intensity.label}</span>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full ${
                                i < intensity.intensity ? intensity.color.replace("text-", "bg-") : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                          <Users className="h-5 w-5 text-muted-foreground mb-1" />
                          <span className="text-2xl font-bold">{getCompetitorCount(analysis)}</span>
                          <span className="text-xs text-muted-foreground">Konkurrenten</span>
                        </div>
                        <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                          <Lightbulb className="h-5 w-5 text-muted-foreground mb-1" />
                          <span className="text-2xl font-bold">{getRecommendationCount(analysis)}</span>
                          <span className="text-xs text-muted-foreground">Empfehlungen</span>
                        </div>
                      </div>
                    </>
                  )}

                  {analysis.status === "generating" && (
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-blue-600">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="font-medium">Analyse wird generiert...</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/competitor-analysis/${analysis.id}`)
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ansehen
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditAnalysis(analysis)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteAnalysis(analysis)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center pt-2">
                    Erstellt am {new Date(analysis.created_at).toLocaleDateString("de-DE")}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialogs */}
      <CreateCompetitorAnalysisDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          loadAnalyses()
          setCreateOpen(false)
        }}
      />

      {editAnalysis && (
        <EditCompetitorAnalysisDialog
          analysis={editAnalysis}
          open={!!editAnalysis}
          onOpenChange={(open) => !open && setEditAnalysis(null)}
          onSuccess={() => {
            loadAnalyses()
            setEditAnalysis(null)
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteAnalysis} onOpenChange={(open) => !open && setDeleteAnalysis(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Analyse löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Konkurrenzanalyse &quot;{deleteAnalysis?.title}&quot; wirklich löschen? Diese Aktion kann
              nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Löschen...
                </>
              ) : (
                "Löschen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default CompetitorAnalysisManagement
