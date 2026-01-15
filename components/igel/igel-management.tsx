"use client"

import { useEffect, useState } from "react"
import {
  Plus,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  BarChart3,
  DollarSign,
  Lightbulb,
  ClipboardList,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreateIgelDialog } from "./create-igel-dialog"
import { ViewIgelDialog } from "./view-igel-dialog"
import { EditIgelDialog } from "./edit-igel-dialog"
import { createBrowserClient } from "@/lib/supabase/client"
import { useUser } from "@/contexts/user-context"

interface IgelAnalysis {
  id: string
  service_name: string
  service_description: string
  category: string
  profitability_score: number
  recommendation: string
  break_even_point: number
  status: string
  pricing_scenarios: any[]
  created_at: string
}

export function IgelManagement() {
  const [analyses, setAnalyses] = useState<IgelAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [viewAnalysis, setViewAnalysis] = useState<IgelAnalysis | null>(null)
  const [editAnalysis, setEditAnalysis] = useState<IgelAnalysis | null>(null)
  const supabase = createBrowserClient()
  const { currentUser: user } = useUser()

  const loadAnalyses = async () => {
    try {
      console.log("[v0] IGEL: Loading analyses, user:", user)

      if (!user?.practice_id) {
        console.log("[v0] IGEL: No practice_id, setting empty array")
        setAnalyses([])
        setLoading(false)
        return
      }

      console.log("[v0] IGEL: Fetching from igel_analyses for practice:", user.practice_id)

      const { data, error: fetchError } = await supabase
        .from("igel_analyses")
        .select("*")
        .eq("practice_id", user.practice_id)
        .order("created_at", { ascending: false })

      if (fetchError) {
        console.error("[v0] IGEL: Error loading analyses:", fetchError)
        if (fetchError.code === "42P01") {
          setError("Die IGEL-Analyse Tabelle existiert noch nicht in der Datenbank.")
        } else {
          setError(`Fehler beim Laden: ${fetchError.message}`)
        }
        setAnalyses([])
      } else {
        console.log("[v0] IGEL: Loaded analyses:", data?.length || 0)
        setAnalyses(data || [])
        setError(null)
      }
    } catch (error) {
      console.error("[v0] IGEL: Unexpected error:", error)
      setError("Ein unerwarteter Fehler ist aufgetreten")
      setAnalyses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalyses()
  }, [user])

  const getRecommendationColor = (recommendation: string) => {
    if (recommendation?.includes("Sehr empfehlenswert")) return "default"
    if (recommendation?.includes("Bedingt")) return "secondary"
    return "destructive"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 70) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (score >= 40) return <AlertCircle className="h-4 w-4 text-yellow-600" />
    return <TrendingDown className="h-4 w-4 text-red-600" />
  }

  if (loading) {
    return <div>Lädt...</div>
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h3 className="text-lg font-medium mb-2">Fehler beim Laden</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">{error}</p>
          <Button onClick={loadAnalyses}>Erneut versuchen</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Selbstzahlerleistungen mit KI
          </CardTitle>
          <CardDescription>
            Analysieren Sie systematisch, welche Selbstzahlerleistungen sich für Ihre Praxis lohnen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-muted rounded">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h4 className="font-medium">Vollständige Kostenanalyse</h4>
                <p className="text-sm text-muted-foreground">Fixkosten, variable Kosten und versteckte Aufwände</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-muted rounded">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h4 className="font-medium">3 Preisszenarien</h4>
                <p className="text-sm text-muted-foreground">Konservativ, realistisch und optimistisch</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-muted rounded">
                <Lightbulb className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h4 className="font-medium">KI-Empfehlungen</h4>
                <p className="text-sm text-muted-foreground">Optimierungsvorschläge und Best Practices</p>
              </div>
            </div>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Neue Selbstzahlerleistung analysieren
          </Button>
        </CardContent>
      </Card>

      {analyses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Noch keine Analysen vorhanden</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Starten Sie Ihre erste Analyse, um herauszufinden, welche Selbstzahlerleistungen sich für Ihre Praxis
              lohnen
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Erste Analyse erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {analyses.map((analysis) => (
            <Card
              key={analysis.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setViewAnalysis(analysis)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{analysis.service_name}</CardTitle>
                    {analysis.category && (
                      <Badge variant="outline" className="mt-2">
                        {analysis.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {getScoreIcon(analysis.profitability_score || 0)}
                    <span className="text-sm font-medium">{analysis.profitability_score || 0}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.service_description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{analysis.service_description}</p>
                )}
                {analysis.recommendation && (
                  <Badge variant={getRecommendationColor(analysis.recommendation)}>{analysis.recommendation}</Badge>
                )}
                {analysis.break_even_point > 0 && (
                  <p className="text-sm">
                    Break-Even: <span className="font-medium">{analysis.break_even_point} Leistungen</span>
                  </p>
                )}
                {analysis.pricing_scenarios?.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {analysis.pricing_scenarios.length} Preisszenarien analysiert
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateIgelDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          loadAnalyses()
          setCreateOpen(false)
        }}
      />

      {viewAnalysis && (
        <ViewIgelDialog
          analysis={viewAnalysis}
          open={!!viewAnalysis}
          onOpenChange={(open) => !open && setViewAnalysis(null)}
          onSuccess={loadAnalyses}
          onEdit={(analysis) => {
            setViewAnalysis(null)
            setEditAnalysis(analysis)
          }}
        />
      )}

      {editAnalysis && (
        <EditIgelDialog
          analysis={editAnalysis}
          open={!!editAnalysis}
          onOpenChange={(open) => {
            if (!open) setEditAnalysis(null)
          }}
          onSuccess={() => {
            loadAnalyses()
            setEditAnalysis(null)
          }}
        />
      )}
    </div>
  )
}
