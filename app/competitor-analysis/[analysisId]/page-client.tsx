"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { Loader2, ArrowLeft, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePractice } from "@/contexts/practice-context"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Import tab components
import { OverviewTab } from "./components/overview-tab"
import { CompetitorsTab } from "./components/competitors-tab"
import { SwotTab } from "./components/swot-tab"
import { InsightsTab } from "./components/insights-tab"
import { ServicesTab } from "./components/services-tab"
import { ReviewsTab } from "./components/reviews-tab"
import { SettingsTab } from "./components/settings-tab"
import type { CompetitorAnalysis } from "./types"

interface CompetitorAnalysisDetailClientProps {
  analysisId: string
}

export default function CompetitorAnalysisDetailClient({ analysisId }: CompetitorAnalysisDetailClientProps) {
  const router = useRouter()
  const { currentPractice } = usePractice()
  const { toast } = useToast()
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (currentPractice?.id && analysisId) {
      loadAnalysis()
    }
  }, [currentPractice?.id, analysisId])

  const loadAnalysis = async () => {
    if (!currentPractice?.id || !analysisId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/competitor-analysis/${analysisId}`)
      if (response.ok) {
        const data = await response.json()
        setAnalysis(data)
      } else {
        toast({
          title: "Fehler",
          description: "Konkurrenzanalyse konnte nicht geladen werden",
          variant: "destructive",
        })
        router.push("/competitor-analysis")
      }
    } catch (error) {
      console.error("Error loading analysis:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Laden der Analyse",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const regenerateAnalysis = async () => {
    if (!currentPractice?.id || !analysisId) return

    setGenerating(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/competitor-analysis/${analysisId}/regenerate`, {
        method: "POST",
      })
      if (response.ok) {
        toast({
          title: "Erfolg",
          description: "Analyse wird neu generiert...",
        })
        await loadAnalysis()
      } else {
        throw new Error("Regeneration failed")
      }
    } catch (error) {
      console.error("Error regenerating:", error)
      toast({
        title: "Fehler",
        description: "Fehler bei der Regenerierung",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const deleteAnalysis = async () => {
    if (!currentPractice?.id || !analysisId) return

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/competitor-analysis/${analysisId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        toast({
          title: "Erfolg",
          description: "Analyse wurde gelöscht",
        })
        router.push("/competitor-analysis")
      } else {
        throw new Error("Delete failed")
      }
    } catch (error) {
      console.error("Error deleting:", error)
      toast({
        title: "Fehler",
        description: "Fehler beim Löschen",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  if (!analysis) {
    return (
      <AppLayout>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Analyse nicht gefunden</p>
            <Button variant="outline" onClick={() => router.push("/competitor-analysis")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zur Übersicht
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/competitor-analysis")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{analysis.title || analysis.name || "Konkurrenzanalyse"}</h1>
              <p className="text-muted-foreground">
                {analysis.location} - {analysis.specialty}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={analysis.status === "completed" ? "default" : "secondary"}>
              {analysis.status === "completed" ? "Abgeschlossen" : analysis.status}
            </Badge>
            <Button variant="outline" size="sm" onClick={regenerateAnalysis} disabled={generating}>
              <RefreshCw className={`h-4 w-4 mr-2 ${generating ? "animate-spin" : ""}`} />
              Aktualisieren
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Löschen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Analyse löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Diese Aktion kann nicht rückgängig gemacht werden. Die Analyse wird permanent gelöscht.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteAnalysis} className="bg-destructive text-destructive-foreground">
                    Löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 h-auto gap-1">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="competitors">Konkurrenten</TabsTrigger>
            <TabsTrigger value="swot">SWOT</TabsTrigger>
            <TabsTrigger value="insights">Empfehlungen</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="reviews">Bewertungen</TabsTrigger>
            <TabsTrigger value="settings">Einstellungen</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab analysis={analysis} />
          </TabsContent>

          <TabsContent value="competitors" className="mt-6">
            <CompetitorsTab competitors={analysis.competitors || []} />
          </TabsContent>

          <TabsContent value="swot" className="mt-6">
            <SwotTab
              strengths={analysis.strengths_weaknesses?.market_strengths || []}
              weaknesses={analysis.strengths_weaknesses?.market_weaknesses || []}
              opportunities={analysis.opportunities}
              threats={analysis.threats}
            />
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <InsightsTab recommendations={analysis.recommendations} />
          </TabsContent>

          <TabsContent value="services" className="mt-6">
            <ServicesTab
              serviceComparison={analysis.service_comparison}
              pricingComparison={analysis.pricing_comparison}
            />
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <ReviewsTab
              reviewsAnalysis={analysis.patient_reviews_analysis}
              onlinePresence={analysis.online_presence}
            />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <SettingsTab
              analysis={analysis}
              onRegenerate={regenerateAnalysis}
              onDelete={deleteAnalysis}
              isRegenerating={generating}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
