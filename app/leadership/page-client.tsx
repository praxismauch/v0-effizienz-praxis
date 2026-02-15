"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/app-layout"
import { PageHeader } from "@/components/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Smile,
  Zap,
  UserCheck,
  Activity,
  Award,
  Brain,
  Plus,
  History,
  RefreshCw,
} from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useTeam } from "@/contexts/team-context"
import { toast } from "sonner"
import type { PermaScores, SelfAssessment, PermaAssessment, LeadershipMetric } from "./types"
import { getScoreColor, getAverageScore, PERMA_DIMENSIONS } from "./types"
import OverviewTab from "./components/overview-tab"
import TeamTab from "./components/team-tab"
import HistoryTab from "./components/history-tab"
import AssessmentDialog from "./components/assessment-dialog"

const initialSelfAssessment: SelfAssessment = {
  positiveEmotions: 70,
  engagement: 70,
  relationships: 70,
  meaning: 70,
  accomplishment: 70,
  vitality: 70,
  notes: "",
}

export default function LeadershipPageClient() {
  const { currentUser } = useUser()
  const { currentPractice } = usePractice()
  const { teamMembers } = useTeam()

  const [activeTab, setActiveTab] = useState("overview")
  const [permaScores, setPermaScores] = useState<PermaScores>({
    positiveEmotions: 0,
    engagement: 0,
    relationships: 0,
    meaning: 0,
    accomplishment: 0,
    vitality: 0,
  })
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false)
  const [selfAssessment, setSelfAssessment] = useState<SelfAssessment>(initialSelfAssessment)
  const [assessmentHistory, setAssessmentHistory] = useState<PermaAssessment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const practiceId = currentPractice?.id

  useEffect(() => {
    if (practiceId && currentUser?.id) {
      fetchPermaData()
    }
  }, [practiceId, currentUser?.id])

  const fetchPermaData = async () => {
    if (!practiceId || !currentUser?.id) return
    setIsLoading(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/perma-assessments?userId=${currentUser.id}`)
      if (response.ok) {
        const data = await response.json()
        setAssessmentHistory(data.assessments || [])
        if (data.assessments?.length > 0) {
          const latest = data.assessments[0]
          setPermaScores({
            positiveEmotions: latest.positive_emotions,
            engagement: latest.engagement,
            relationships: latest.relationships,
            meaning: latest.meaning,
            accomplishment: latest.accomplishment,
            vitality: latest.vitality,
          })
        }
      }
    } catch (error) {
      console.error("Error fetching PERMA data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAssessment = async () => {
    if (!practiceId || !currentUser?.id) return
    setIsSaving(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/perma-assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          positiveEmotions: selfAssessment.positiveEmotions,
          engagement: selfAssessment.engagement,
          relationships: selfAssessment.relationships,
          meaning: selfAssessment.meaning,
          accomplishment: selfAssessment.accomplishment,
          vitality: selfAssessment.vitality,
          notes: selfAssessment.notes,
          assessmentType: "self",
        }),
      })
      if (response.ok) {
        toast.success("Selbsteinschätzung gespeichert")
        setShowAssessmentDialog(false)
        setSelfAssessment(initialSelfAssessment)
        fetchPermaData()
      } else {
        toast.error("Fehler beim Speichern")
      }
    } catch (error) {
      toast.error("Fehler beim Speichern")
    } finally {
      setIsSaving(false)
    }
  }

  const metrics: LeadershipMetric[] = [
    {
      label: "Team Zufriedenheit",
      value: 78,
      target: 85,
      trend: "up",
      icon: <Smile className="h-5 w-5 text-amber-500" />,
    },
    {
      label: "Ziel-Erreichung",
      value: 65,
      target: 80,
      trend: "stable",
      icon: <Target className="h-5 w-5 text-blue-500" />,
    },
    {
      label: "Team Engagement",
      value: 72,
      target: 75,
      trend: "up",
      icon: <Zap className="h-5 w-5 text-purple-500" />,
    },
    {
      label: "Feedback Kultur",
      value: 68,
      target: 80,
      trend: "down",
      icon: <UserCheck className="h-5 w-5 text-emerald-500" />,
    },
  ]

  const avgScore = getAverageScore(permaScores)

  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
        {/* Header */}
        <PageHeader
          title="Fuehrung & Wohlbefinden"
          subtitle="PERMA-V basiertes Leadership Dashboard fuer nachhaltige Teamfuehrung"
          actions={
            <>
              <Button variant="outline" onClick={fetchPermaData} disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Aktualisieren
              </Button>
              <Button onClick={() => setShowAssessmentDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Selbsteinschaetzung
              </Button>
            </>
          }
        />

        {/* PERMA-V Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {PERMA_DIMENSIONS.map((dimension) => {
            const score = permaScores[dimension.value as keyof PermaScores]
            return (
              <Card key={dimension.value}>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground mb-1">{dimension.label}</div>
                  <div className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</div>
                  <Progress value={score} className="h-1.5 mt-2" />
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto gap-1">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="history">Verlauf</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-6">
            <OverviewTab
              metrics={metrics}
              permaScores={permaScores}
              avgScore={avgScore}
              isLoading={isLoading}
            />
          </TabsContent>
          <TabsContent value="team" className="mt-6">
            <TeamTab teamMembers={teamMembers} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="history" className="mt-6">
            <HistoryTab assessments={assessmentHistory} isLoading={isLoading} />
          </TabsContent>
        </Tabs>

        {/* Assessment Dialog */}
        <AssessmentDialog
          open={showAssessmentDialog}
          onOpenChange={setShowAssessmentDialog}
          assessment={selfAssessment}
          onAssessmentChange={setSelfAssessment}
          onSave={handleSaveAssessment}
          isSaving={isSaving}
        />
      </div>
    </AppLayout>
  )
}
