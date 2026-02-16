"use client"

import React from "react"

import { useState, useEffect, useCallback } from "react"
import { AppLayout } from "@/components/app-layout"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import {
  Smile,
  Zap,
  Users,
  Target,
  Award,
  Heart,
  Plus,
  History,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts"
import { OverviewTab } from "./components/overview-tab"
import { TeamTab } from "./components/team-tab"
import { DimensionsTab } from "./components/dimensions-tab"
import { 
  type PermaScores, 
  type PermaAssessment, 
  type ActionItem,
  PERMA_DIMENSIONS 
} from "./types"

// Icon mapping for dimensions
const dimensionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Smile,
  Zap,
  Users,
  Target,
  Award,
  Heart,
}

export default function PermaVPageClient() {
  const { currentUser } = useUser()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  
  // Assessment state
  const [currentScores, setCurrentScores] = useState<PermaScores>({
    positiveEmotions: 5,
    engagement: 5,
    relationships: 5,
    meaning: 5,
    accomplishment: 5,
    vitality: 5,
  })
  const [assessments, setAssessments] = useState<PermaAssessment[]>([])
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  
  // Dialog state
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [assessmentNotes, setAssessmentNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const practiceId = currentPractice?.id?.toString()
  const userId = currentUser?.id

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch assessments
  const fetchAssessments = useCallback(async () => {
    if (!practiceId || !userId) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/perma-assessments?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setAssessments(data.assessments || [])
        
        // Set current scores from latest assessment if available
        if (data.assessments?.length > 0) {
          const latest = data.assessments[0]
          setCurrentScores({
            positiveEmotions: latest.positive_emotions,
            engagement: latest.engagement,
            relationships: latest.relationships,
            meaning: latest.meaning,
            accomplishment: latest.accomplishment,
            vitality: latest.vitality,
          })
          setActionItems(latest.action_items || [])
        }
      }
    } catch (error) {
      console.error("Error fetching assessments:", error)
    } finally {
      setIsLoading(false)
    }
  }, [practiceId, userId])

  useEffect(() => {
    if (practiceId && userId && mounted) {
      fetchAssessments()
    } else if (mounted && !practiceLoading) {
      setIsLoading(false)
    }
  }, [practiceId, userId, mounted, practiceLoading, fetchAssessments])

  // Save assessment
  const handleSaveAssessment = async () => {
    if (!practiceId || !userId) {
      toast.error("Keine Praxis oder Benutzer gefunden")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/perma-assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          scores: {
            positive_emotions: currentScores.positiveEmotions,
            engagement: currentScores.engagement,
            relationships: currentScores.relationships,
            meaning: currentScores.meaning,
            accomplishment: currentScores.accomplishment,
            vitality: currentScores.vitality,
          },
          notes: assessmentNotes,
          actionItems,
        }),
      })

      if (response.ok) {
        toast.success("Bewertung gespeichert")
        setShowAssessmentDialog(false)
        setAssessmentNotes("")
        fetchAssessments()
      } else {
        toast.error("Fehler beim Speichern")
      }
    } catch (error) {
      console.error("Error saving assessment:", error)
      toast.error("Fehler beim Speichern")
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate average score
  const averageScore = Object.values(currentScores).reduce((a, b) => a + b, 0) / 6

  // Get trend indicator
  const getTrend = () => {
    if (assessments.length < 2) return "stable"
    const latest = assessments[0]
    const previous = assessments[1]
    const latestAvg = (latest.positive_emotions + latest.engagement + latest.relationships + 
                       latest.meaning + latest.accomplishment + latest.vitality) / 6
    const previousAvg = (previous.positive_emotions + previous.engagement + previous.relationships + 
                         previous.meaning + previous.accomplishment + previous.vitality) / 6
    if (latestAvg > previousAvg + 0.5) return "up"
    if (latestAvg < previousAvg - 0.5) return "down"
    return "stable"
  }

  // Radar chart data
  const radarData = PERMA_DIMENSIONS.map((dim) => ({
    dimension: dim.name,
    fullName: dim.fullName,
    score: currentScores[dim.key],
    fullMark: 10,
  }))

  // Loading state
  if (!mounted || practiceLoading || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (!practiceId) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">Keine Praxis ausgewählt</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  const trend = getTrend()

  return (
    <AppLayout>
      <div className="w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">PERMA-V Wohlbefinden</h1>
            <p className="text-muted-foreground">
              Messen und verbessern Sie das Wohlbefinden in Ihrer Praxis
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowHistoryDialog(true)}>
              <History className="h-4 w-4 mr-2" />
              Verlauf
            </Button>
            <Button onClick={() => setShowAssessmentDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Neue Bewertung
            </Button>
          </div>
        </div>

        {/* Score Overview Card */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Ihr PERMA-V Score</CardTitle>
                <CardDescription>
                  {assessments.length > 0 
                    ? `Letzte Bewertung: ${format(new Date(assessments[0].assessment_date), "dd. MMMM yyyy", { locale: de })}`
                    : "Noch keine Bewertung vorhanden"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-4xl font-bold">{averageScore.toFixed(1)}</span>
                <span className="text-muted-foreground">/10</span>
                {trend === "up" && <TrendingUp className="h-5 w-5 text-green-500" />}
                {trend === "down" && <TrendingDown className="h-5 w-5 text-red-500" />}
                {trend === "stable" && <Minus className="h-5 w-5 text-gray-400" />}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {PERMA_DIMENSIONS.map((dim) => {
                const Icon = dimensionIcons[dim.icon]
                const score = currentScores[dim.key]
                return (
                  <div key={dim.key} className="text-center">
                    <div 
                      className="w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center"
                      style={{ backgroundColor: `${dim.color}20` }}
                    >
                      <Icon className="h-6 w-6" style={{ color: dim.color }} />
                    </div>
                    <p className="text-xs text-muted-foreground">{dim.fullName}</p>
                    <p className="text-lg font-semibold">{score.toFixed(1)}</p>
                    <Progress 
                      value={score * 10} 
                      className="h-1 mt-1"
                      style={{ 
                        // @ts-ignore
                        "--progress-color": dim.color 
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto gap-1">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Übersicht
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="h-4 w-4 mr-2" />
              Team
            </TabsTrigger>
            <TabsTrigger value="dimensions">
              <RefreshCw className="h-4 w-4 mr-2" />
              Dimensionen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <OverviewTab
              radarData={radarData}
              assessments={assessments}
              actionItems={actionItems}
            />
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <TeamTab practiceId={practiceId} />
          </TabsContent>

          <TabsContent value="dimensions" className="mt-6">
            <DimensionsTab
              currentScores={currentScores}
              onStartAssessment={() => setShowAssessmentDialog(true)}
            />
          </TabsContent>
        </Tabs>

        {/* Assessment Dialog */}
        <Dialog open={showAssessmentDialog} onOpenChange={setShowAssessmentDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neue PERMA-V Bewertung</DialogTitle>
              <DialogDescription>
                Bewerten Sie Ihr aktuelles Wohlbefinden in jeder Dimension von 1-10
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {PERMA_DIMENSIONS.map((dim) => {
                const Icon = dimensionIcons[dim.icon]
                return (
                  <div key={dim.key} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${dim.color}20` }}
                      >
                        <Icon className="h-4 w-4" style={{ color: dim.color }} />
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm font-medium">{dim.fullName}</Label>
                        <p className="text-xs text-muted-foreground">{dim.description}</p>
                      </div>
                      <Badge variant="outline">{currentScores[dim.key]}</Badge>
                    </div>
                    <Slider
                      value={[currentScores[dim.key]]}
                      onValueChange={(value) => 
                        setCurrentScores((prev) => ({ ...prev, [dim.key]: value[0] }))
                      }
                      max={10}
                      min={1}
                      step={0.5}
                      className="py-2"
                    />
                  </div>
                )
              })}

              <div className="space-y-2">
                <Label>Notizen (optional)</Label>
                <Textarea
                  value={assessmentNotes}
                  onChange={(e) => setAssessmentNotes(e.target.value)}
                  placeholder="Fügen Sie Notizen zu Ihrer Bewertung hinzu..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAssessmentDialog(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSaveAssessment} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  "Bewertung speichern"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Bewertungsverlauf</DialogTitle>
              <DialogDescription>
                Ihre bisherigen PERMA-V Bewertungen
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[400px]">
              {assessments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Noch keine Bewertungen vorhanden
                </p>
              ) : (
                <div className="space-y-3">
                  {assessments.map((assessment) => {
                    const avg = (assessment.positive_emotions + assessment.engagement + 
                                 assessment.relationships + assessment.meaning + 
                                 assessment.accomplishment + assessment.vitality) / 6
                    return (
                      <Card key={assessment.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {format(new Date(assessment.assessment_date), "dd. MMMM yyyy", { locale: de })}
                            </p>
                            {assessment.notes && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {assessment.notes}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary">{avg.toFixed(1)}/10</Badge>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
