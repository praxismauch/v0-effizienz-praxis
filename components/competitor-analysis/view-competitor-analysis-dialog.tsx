"use client"

import { useState } from "react"
import { Loader2, MapPin, Briefcase, BarChart3, Sparkles, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"
import {
  OverviewTab,
  CompetitorsTab,
  RatingsTab,
  SwotTab,
  PricingTab,
  OnlinePresenceTab,
  RecommendationsTab,
} from "./view-dialog-tabs"

interface CompetitorAnalysis {
  id: string
  practice_id: string
  location: string
  specialty: string
  radius_km: number
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
  created_at: string
  name: string
  ai_analysis: any
}

interface ViewCompetitorAnalysisDialogProps {
  analysis: CompetitorAnalysis
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (analysis: CompetitorAnalysis) => void
  onRefresh: () => void
}

export function ViewCompetitorAnalysisDialog({
  analysis,
  open,
  onOpenChange,
  onEdit,
  onRefresh,
}: ViewCompetitorAnalysisDialogProps) {
  const { currentPractice } = useUser()
  const { toast } = useToast()
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  const handleGenerate = async () => {
    if (!currentPractice?.id) return

    setGenerating(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/competitor-analysis/${analysis.id}/generate`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Erfolg",
          description: "Analyse wurde erfolgreich generiert",
        })
        onRefresh()
        onOpenChange(false)
      } else {
        throw new Error("Generation failed")
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Analyse konnte nicht generiert werden",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  if (analysis.status !== "completed") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{analysis.title}</DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="h-4 w-4" />
                {analysis.location}
                <span className="mx-2">{"•"}</span>
                <Briefcase className="h-4 w-4" />
                {analysis.specialty}
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="py-8 text-center space-y-4">
            {analysis.status === "generating" ? (
              <>
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">
                  Die Analyse wird gerade generiert. Dies kann einige Minuten dauern...
                </p>
              </>
            ) : analysis.status === "error" ? (
              <>
                <AlertTriangle className="h-12 w-12 mx-auto text-red-500" />
                <p className="text-muted-foreground">Bei der Generierung ist ein Fehler aufgetreten.</p>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Erneut versuchen
                </Button>
              </>
            ) : (
              <>
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Diese Analyse wurde noch nicht generiert.</p>
                <Button onClick={handleGenerate} disabled={generating}>
                  {generating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Jetzt mit KI generieren
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Konkurrenzanalyse: {analysis.name}
          </DialogTitle>
          <DialogDescription>
            {analysis.location} {"•"} {analysis.specialty} {"•"} {analysis.radius_km} km Radius
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid grid-cols-7 w-full">
            <TabsTrigger value="overview">{"Übersicht"}</TabsTrigger>
            <TabsTrigger value="competitors">Konkurrenten</TabsTrigger>
            <TabsTrigger value="ratings">Bewertungen</TabsTrigger>
            <TabsTrigger value="swot">SWOT</TabsTrigger>
            <TabsTrigger value="pricing">Preise</TabsTrigger>
            <TabsTrigger value="online">Online</TabsTrigger>
            <TabsTrigger value="recommendations">Empfehlungen</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <div className="pr-4 pb-4">
              <TabsContent value="overview" className="mt-0">
                <OverviewTab analysis={analysis} />
              </TabsContent>
              <TabsContent value="competitors" className="mt-0">
                <CompetitorsTab analysis={analysis} />
              </TabsContent>
              <TabsContent value="ratings" className="mt-0">
                <RatingsTab analysis={analysis} />
              </TabsContent>
              <TabsContent value="swot" className="mt-0">
                <SwotTab analysis={analysis} />
              </TabsContent>
              <TabsContent value="pricing" className="mt-0">
                <PricingTab analysis={analysis} />
              </TabsContent>
              <TabsContent value="online" className="mt-0">
                <OnlinePresenceTab analysis={analysis} />
              </TabsContent>
              <TabsContent value="recommendations" className="mt-0">
                <RecommendationsTab analysis={analysis} />
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {"Schließen"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ViewCompetitorAnalysisDialog
