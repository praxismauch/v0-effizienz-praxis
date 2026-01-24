"use client"

import { useState, useEffect } from "react"
import { Plus, TrendingUp, AlertCircle, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreateRoiAnalysisDialog } from "@/components/roi/create-roi-analysis-dialog"
import { RoiAnalysisCard } from "@/components/roi/roi-analysis-card"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { AppLayout } from "@/components/app-layout"
import { toast } from "sonner"

interface RoiAnalysis {
  id: string
  service_name: string
  description: string
  total_fixed_costs: number
  total_variable_costs: number
  scenario_realistic: number
  demand_realistic: number
  break_even_months: number
  roi_score: number
  recommendation: string
  created_at: string
}

async function fetchWithRetry(url: string, options?: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options)

    if (response.status === 429 || response.status === 503) {
      if (i < retries - 1) {
        const delay = Math.pow(2, i) * 1000
        await new Promise((r) => setTimeout(r, delay))
        continue
      }
    }

    return response
  }
  throw new Error("Max retries reached")
}

export default function RoiAnalysisPage() {
  const [analyses, setAnalyses] = useState<RoiAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const { currentUser, loading: authLoading } = useUser()
  const { currentPractice, isLoading: practiceLoading } = usePractice()

  const practiceId = currentPractice?.id?.toString()

  useEffect(() => {
    if (authLoading || practiceLoading) return
    if (!currentUser) {
      setLoading(false)
      return
    }
    if (practiceId) {
      fetchAnalyses(practiceId)
    } else {
      setLoading(false)
    }
  }, [currentUser, authLoading, practiceLoading, practiceId])

  const fetchAnalyses = async (practiceId: string) => {
    if (!practiceId) {
      toast.error("Keine Praxis-ID gefunden. Bitte neu laden.")
      setLoading(false)
      return
    }

    try {
      const response = await fetchWithRetry(`/api/roi-analysis?practice_id=${practiceId}`)

      if (response.ok) {
        const data = await response.json()
        setAnalyses(data)
      } else {
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("application/json")) {
          const errorData = await response.json()
          console.error("ROI Analysis - Failed to fetch analyses:", errorData)
          toast.error("Fehler beim Laden der ROI-Analysen")
        } else {
          const errorText = await response.text()
          console.error("ROI Analysis - Failed to fetch analyses:", { error: errorText })
          toast.error("Fehler beim Laden der ROI-Analysen")
        }
      }
    } catch (error) {
      console.error("ROI Analysis - Error fetching ROI analyses:", error)
      toast.error("Fehler beim Laden der ROI-Analysen")
    } finally {
      setLoading(false)
    }
  }

  const handleAnalysisCreated = () => {
    if (currentUser?.practice_id) {
      fetchAnalyses(currentUser.practice_id)
    }
    setCreateDialogOpen(false)
  }

  const handleAnalysisDeleted = (id: string) => {
    setAnalyses(analyses.filter((a) => a.id !== id))
  }

  const handleOpenCreateDialog = () => {
    if (!currentUser?.practice_id) {
      alert("Bitte warten Sie, bis die Praxis geladen ist.")
      return
    }
    setCreateDialogOpen(true)
  }

  if (loading || authLoading) {
    return <AppLayout loading={true} loadingMessage="ROI-Analysen werden geladen..." />
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calculator className="h-8 w-8" />
              Lohnt-es-sich-Analyse
            </h1>
            <p className="text-muted-foreground mt-1">
              Berechnen Sie die Wirtschaftlichkeit neuer Leistungen und Investitionen
            </p>
          </div>
          <Button onClick={handleOpenCreateDialog} size="lg" disabled={!currentUser?.practice_id}>
            <Plus className="h-4 w-4 mr-2" />
            Neue Analyse
          </Button>
        </div>

        {/* Info Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Analysieren Sie die Wirtschaftlichkeit neuer Leistungen durch Eingabe von Kosten, Preisen und erwarteter
            Nachfrage. Das Tool berechnet automatisch Gewinnpotenzial, Amortisation und gibt eine fundierte Empfehlung.
          </AlertDescription>
        </Alert>

        {/* Analyses Grid */}
        {analyses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Keine Analysen vorhanden</h3>
              <p className="text-muted-foreground text-center mb-4">
                Erstellen Sie Ihre erste Lohnt-es-sich-Analyse, um die Wirtschaftlichkeit neuer Leistungen zu bewerten.
              </p>
              <Button onClick={handleOpenCreateDialog} disabled={!currentUser?.practice_id}>
                <Plus className="h-4 w-4 mr-2" />
                Erste Analyse erstellen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analyses.map((analysis) => (
              <RoiAnalysisCard
                key={analysis.id}
                analysis={analysis}
                onDeleted={handleAnalysisDeleted}
                onUpdated={() => currentUser?.practice_id && fetchAnalyses(currentUser.practice_id)}
              />
            ))}
          </div>
        )}

        {/* Create Dialog - Pass practiceId and userId from currentUser */}
        {currentUser?.practice_id && (
          <CreateRoiAnalysisDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onSuccess={handleAnalysisCreated}
            practiceId={currentUser.practice_id}
            userId={currentUser.id}
          />
        )}
      </div>
    </AppLayout>
  )
}
