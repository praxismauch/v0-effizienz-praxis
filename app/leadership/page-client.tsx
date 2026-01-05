"use client"

import type React from "react"
import { PainPointsActionCard } from "@/components/dashboard/pain-points-action-card"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  CheckCircle2,
  MessageCircle,
  Smile,
  Zap,
  UserCheck,
  Activity,
  Award,
  ThumbsUp,
  BarChart3,
  Brain,
  Save,
  Plus,
  History,
  RefreshCw,
  Calendar,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { useTeam } from "@/contexts/team-context"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { toast } from "sonner"

interface LeadershipMetric {
  label: string
  value: number
  target: number
  trend: "up" | "down" | "stable"
  icon: React.ReactNode
}

interface TeamPerformance {
  memberId: string
  memberName: string
  avatar?: string
  role: string
  completedTasks: number
  totalTasks: number
  goalsAchieved: number
  totalGoals: number
  satisfaction: number
  lastFeedback: string
}

interface PermaScores {
  positiveEmotions: number
  engagement: number
  relationships: number
  meaning: number
  accomplishment: number
  vitality: number
}

interface PermaAssessment {
  id: string
  practice_id: string
  user_id: string
  positive_emotions: number
  engagement: number
  relationships: number
  meaning: number
  accomplishment: number
  vitality: number
  assessment_date: string
  assessment_type: string
  notes: string | null
  action_items: ActionItem[]
  created_at: string
  updated_at: string
}

interface ActionItem {
  id: string
  dimension: string
  title: string
  description?: string
  status: "pending" | "in_progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high"
  due_date?: string
}

export default function LeadershipPageClient() {
  const router = useRouter()
  const { currentUser, isLoading: userLoading } = useUser()
  const { currentPractice, isLoading: practiceLoading } = usePractice()
  const { teamMembers } = useTeam()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [teamPerformance, setTeamPerformance] = useState<TeamPerformance[]>([])
  const [activeTab, setActiveTab] = useState("overview")

  const [permaScores, setPermaScores] = useState<PermaScores>({
    positiveEmotions: 50,
    engagement: 50,
    relationships: 50,
    meaning: 50,
    accomplishment: 50,
    vitality: 50,
  })
  const [editingScores, setEditingScores] = useState<PermaScores | null>(null)
  const [currentAssessment, setCurrentAssessment] = useState<PermaAssessment | null>(null)
  const [assessmentHistory, setAssessmentHistory] = useState<PermaAssessment[]>([])
  const [practiceAverages, setPracticeAverages] = useState<PermaScores | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [assessmentNotes, setAssessmentNotes] = useState("")
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [newActionItem, setNewActionItem] = useState<Partial<ActionItem>>({
    dimension: "positive_emotions",
    title: "",
    priority: "medium",
    status: "pending",
  })

  useEffect(() => {
    if (userLoading || practiceLoading) return
    if (!currentUser) {
      router.push("/auth/login")
      return
    }

    loadLeadershipData()
    loadPermaData()
  }, [currentUser, currentPractice, userLoading, practiceLoading, router])

  const loadPermaData = async () => {
    if (!currentPractice?.id || !currentUser?.id) return

    try {
      const response = await fetch(
        `/api/practices/${currentPractice.id}/perma-assessments?userId=${currentUser.id}&limit=10`,
      )

      if (response.status === 429) {
        console.log("[v0] PERMA assessments rate limited, using cached data")
        return
      }

      const responseText = await response.text()

      if (responseText.includes("Too Many") || responseText.includes("rate limit")) {
        console.log("[v0] PERMA assessments rate limited (text response), using cached data")
        return
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("[v0] Failed to parse PERMA response:", responseText.substring(0, 100))
        return
      }

      if (response.ok && data) {
        if (data.latestAssessment) {
          const assessment = data.latestAssessment
          setCurrentAssessment(assessment)
          setPermaScores({
            positiveEmotions: assessment.positive_emotions,
            engagement: assessment.engagement,
            relationships: assessment.relationships,
            meaning: assessment.meaning,
            accomplishment: assessment.accomplishment,
            vitality: assessment.vitality,
          })
          setAssessmentNotes(assessment.notes || "")
          setActionItems(assessment.action_items || [])
        }

        if (data.assessments) {
          setAssessmentHistory(data.assessments)
        }

        if (data.practiceAverages) {
          setPracticeAverages(data.practiceAverages)
        }
      }
    } catch (error) {
      console.error("Error loading PERMA data:", error)
    }
  }

  const savePermaAssessment = async () => {
    if (!currentPractice?.id || !currentUser?.id || !editingScores) return

    setIsSaving(true)
    try {
      const method = currentAssessment ? "PUT" : "POST"
      const body = {
        ...(currentAssessment && { id: currentAssessment.id }),
        userId: currentUser.id,
        positiveEmotions: editingScores.positiveEmotions,
        engagement: editingScores.engagement,
        relationships: editingScores.relationships,
        meaning: editingScores.meaning,
        accomplishment: editingScores.accomplishment,
        vitality: editingScores.vitality,
        notes: assessmentNotes,
        actionItems: actionItems,
        assessmentType: "self",
      }

      const response = await fetch(`/api/practices/${currentPractice.id}/perma-assessments`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const savedAssessment = await response.json()
        setCurrentAssessment(savedAssessment)
        setPermaScores(editingScores)
        setShowEditDialog(false)
        toast.success("PERMA-V Bewertung gespeichert")
        loadPermaData()
      } else {
        const error = await response.json()
        toast.error(error.error || "Fehler beim Speichern")
      }
    } catch (error) {
      console.error("Error saving PERMA assessment:", error)
      toast.error("Fehler beim Speichern der Bewertung")
    } finally {
      setIsSaving(false)
    }
  }

  const createNewAssessment = async () => {
    if (!currentPractice?.id || !currentUser?.id) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/perma-assessments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          positiveEmotions: 50,
          engagement: 50,
          relationships: 50,
          meaning: 50,
          accomplishment: 50,
          vitality: 50,
          assessmentType: "self",
          notes: "",
          actionItems: [],
        }),
      })

      if (response.ok) {
        toast.success("Neue PERMA-V Bewertung erstellt")
        loadPermaData()
      } else {
        const error = await response.json()
        toast.error(error.error || "Fehler beim Erstellen")
      }
    } catch (error) {
      console.error("Error creating PERMA assessment:", error)
      toast.error("Fehler beim Erstellen der Bewertung")
    } finally {
      setIsSaving(false)
    }
  }

  const addActionItem = () => {
    if (!newActionItem.title?.trim()) {
      toast.error("Bitte geben Sie einen Titel ein")
      return
    }

    const item: ActionItem = {
      id: crypto.randomUUID(),
      dimension: newActionItem.dimension || "positive_emotions",
      title: newActionItem.title,
      description: newActionItem.description,
      status: "pending",
      priority: newActionItem.priority || "medium",
      due_date: newActionItem.due_date,
    }

    setActionItems([...actionItems, item])
    setNewActionItem({
      dimension: "positive_emotions",
      title: "",
      priority: "medium",
      status: "pending",
    })
    toast.success("Maßnahme hinzugefügt")
  }

  const toggleActionItemStatus = (itemId: string) => {
    setActionItems((items) =>
      items.map((item) =>
        item.id === itemId ? { ...item, status: item.status === "completed" ? "pending" : "completed" } : item,
      ),
    )
  }

  const loadLeadershipData = async () => {
    setIsLoading(true)
    try {
      const performance: TeamPerformance[] = teamMembers.map((member) => ({
        memberId: member.id,
        memberName: `${member.first_name} ${member.last_name}`,
        avatar: member.avatar_url,
        role: member.role || "Mitarbeiter",
        completedTasks: Math.floor(Math.random() * 20) + 10,
        totalTasks: Math.floor(Math.random() * 10) + 25,
        goalsAchieved: Math.floor(Math.random() * 3) + 1,
        totalGoals: Math.floor(Math.random() * 2) + 4,
        satisfaction: Math.floor(Math.random() * 30) + 70,
        lastFeedback: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      }))
      setTeamPerformance(performance)
    } catch (error) {
      console.error("Error loading leadership data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (userLoading || practiceLoading) {
    return <AppLayout loading loadingMessage="Laden..." />
  }

  if (!currentUser) {
    return null
  }

  const metrics: LeadershipMetric[] = [
    {
      label: "Team-Zufriedenheit",
      value: 85,
      target: 90,
      trend: "up",
      icon: <Heart className="h-5 w-5 text-rose-500" />,
    },
    {
      label: "Ziel-Erreichung",
      value: 72,
      target: 80,
      trend: "up",
      icon: <Target className="h-5 w-5 text-emerald-500" />,
    },
    {
      label: "Aufgaben-Completion",
      value: 88,
      target: 85,
      trend: "stable",
      icon: <CheckCircle2 className="h-5 w-5 text-blue-500" />,
    },
    {
      label: "Feedback-Quote",
      value: 65,
      target: 75,
      trend: "down",
      icon: <MessageCircle className="h-5 w-5 text-amber-500" />,
    },
  ]

  const permaVModel = [
    {
      key: "positiveEmotions",
      dbKey: "positive_emotions",
      letter: "P",
      title: "Positive Emotionen",
      subtitle: "Positive Emotions",
      description: "Freude, Dankbarkeit, Hoffnung und Zufriedenheit im Arbeitsalltag fördern",
      icon: <Smile className="h-6 w-6" />,
      color: "bg-amber-500",
      lightColor: "bg-amber-50 border-amber-200",
      textColor: "text-amber-700",
      score: permaScores.positiveEmotions,
      average: practiceAverages?.positiveEmotions,
      practices: [
        "Tägliche Erfolge würdigen",
        "Positives Feedback geben",
        "Humor am Arbeitsplatz zulassen",
        "Dankbarkeitsrituale einführen",
      ],
    },
    {
      key: "engagement",
      dbKey: "engagement",
      letter: "E",
      title: "Engagement",
      subtitle: "Flow & Involvement",
      description: "Tiefes Eintauchen in Aufgaben und volle Konzentration ermöglichen",
      icon: <Zap className="h-6 w-6" />,
      color: "bg-orange-500",
      lightColor: "bg-orange-50 border-orange-200",
      textColor: "text-orange-700",
      score: permaScores.engagement,
      average: practiceAverages?.engagement,
      practices: [
        "Stärken gezielt einsetzen",
        "Herausfordernde Aufgaben vergeben",
        "Autonomie gewähren",
        "Unterbrechungen minimieren",
      ],
    },
    {
      key: "relationships",
      dbKey: "relationships",
      letter: "R",
      title: "Beziehungen",
      subtitle: "Positive Relationships",
      description: "Vertrauensvolle und unterstützende Beziehungen im Team aufbauen",
      icon: <UserCheck className="h-6 w-6" />,
      color: "bg-rose-500",
      lightColor: "bg-rose-50 border-rose-200",
      textColor: "text-rose-700",
      score: permaScores.relationships,
      average: practiceAverages?.relationships,
      practices: [
        "Regelmäßige Team-Events",
        "Aktives Zuhören praktizieren",
        "Konflikte konstruktiv lösen",
        "Mentoring-Programme anbieten",
      ],
    },
    {
      key: "meaning",
      dbKey: "meaning",
      letter: "M",
      title: "Sinn",
      subtitle: "Meaning & Purpose",
      description: "Den größeren Zweck der Arbeit vermitteln und Sinnhaftigkeit stärken",
      icon: <Activity className="h-6 w-6" />,
      color: "bg-indigo-500",
      lightColor: "bg-indigo-50 border-indigo-200",
      textColor: "text-indigo-700",
      score: permaScores.meaning,
      average: practiceAverages?.meaning,
      practices: [
        "Vision und Mission kommunizieren",
        "Beitrag zum Ganzen verdeutlichen",
        "Werte leben und vorleben",
        "Patientengeschichten teilen",
      ],
    },
    {
      key: "accomplishment",
      dbKey: "accomplishment",
      letter: "A",
      title: "Zielerreichung",
      subtitle: "Accomplishment",
      description: "Erfolge feiern und das Gefühl von Kompetenz und Fortschritt fördern",
      icon: <Award className="h-6 w-6" />,
      color: "bg-emerald-500",
      lightColor: "bg-emerald-50 border-emerald-200",
      textColor: "text-emerald-700",
      score: permaScores.accomplishment,
      average: practiceAverages?.accomplishment,
      practices: [
        "Klare Ziele definieren",
        "Meilensteine feiern",
        "Fortschritte sichtbar machen",
        "Entwicklungsmöglichkeiten bieten",
      ],
    },
    {
      key: "vitality",
      dbKey: "vitality",
      letter: "V",
      title: "Vitalität",
      subtitle: "Vitality & Health",
      description: "Körperliche und geistige Gesundheit als Grundlage für Leistung",
      icon: <ThumbsUp className="h-6 w-6" />,
      color: "bg-teal-500",
      lightColor: "bg-teal-50 border-teal-200",
      textColor: "text-teal-700",
      score: permaScores.vitality,
      average: practiceAverages?.vitality,
      practices: [
        "Work-Life-Balance fördern",
        "Pausen aktiv unterstützen",
        "Bewegung am Arbeitsplatz",
        "Stressmanagement-Angebote",
      ],
    },
  ]

  const overallPermaScore = Math.round(
    Object.values(permaScores).reduce((a, b) => a + b, 0) / Object.values(permaScores).length,
  )

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600"
    if (score >= 60) return "text-amber-600"
    return "text-red-600"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 80)
      return { label: "Sehr gut", variant: "default" as const, className: "bg-emerald-100 text-emerald-700" }
    if (score >= 60) return { label: "Gut", variant: "secondary" as const, className: "bg-amber-100 text-amber-700" }
    return { label: "Verbesserungspotenzial", variant: "destructive" as const, className: "bg-red-100 text-red-700" }
  }

  const dimensionOptions = [
    { value: "positive_emotions", label: "Positive Emotionen" },
    { value: "engagement", label: "Engagement" },
    { value: "relationships", label: "Beziehungen" },
    { value: "meaning", label: "Sinn" },
    { value: "accomplishment", label: "Zielerreichung" },
    { value: "vitality", label: "Vitalität" },
  ]

  return (
    <AppLayout title="Leadership" description="Team-Performance und PERMA-V Wohlbefindensmodell" loading={isLoading}>
      <div className="space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Übersicht</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
            <TabsTrigger value="perma" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">PERMA-V</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Pain Points Action Card */}
        <PainPointsActionCard />

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <Card key={metric.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    {metric.icon}
                    {metric.trend === "up" && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                    {metric.trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
                    {metric.trend === "stable" && <Minus className="h-4 w-4 text-gray-500" />}
                  </div>
                  <div className="mt-4">
                    <div className="text-2xl font-bold">{metric.value}%</div>
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    <Progress value={metric.value} className="mt-2" />
                    <p className="mt-1 text-xs text-muted-foreground">Ziel: {metric.target}%</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Team Tab */}
        {activeTab === "team" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teamPerformance.map((member) => (
              <Card key={member.memberId}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {member.memberName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{member.memberName}</h3>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Aufgaben</span>
                      <span>
                        {member.completedTasks}/{member.totalTasks}
                      </span>
                    </div>
                    <Progress value={(member.completedTasks / member.totalTasks) * 100} />
                    <div className="flex justify-between text-sm">
                      <span>Zufriedenheit</span>
                      <span className={getScoreColor(member.satisfaction)}>{member.satisfaction}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* PERMA Tab */}
        {activeTab === "perma" && (
          <div className="space-y-6">
            {/* PERMA-V Header with actions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-indigo-500" />
                      PERMA-V Modell
                    </CardTitle>
                    <CardDescription>
                      Das PERMA-V Modell beschreibt die sechs Säulen des Wohlbefindens
                      {currentAssessment && (
                        <span className="ml-2 text-xs">
                          (Letzte Bewertung:{" "}
                          {format(new Date(currentAssessment.assessment_date), "dd.MM.yyyy", { locale: de })})
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getScoreColor(overallPermaScore)}`}>
                        {overallPermaScore}%
                      </div>
                      <Badge className={getScoreBadge(overallPermaScore).className}>
                        {getScoreBadge(overallPermaScore).label}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="flex gap-2">
                <Button
                  onClick={() => {
                    setEditingScores({ ...permaScores })
                    setShowEditDialog(true)
                  }}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  Bewertung bearbeiten
                </Button>
                <Button
                  variant="outline"
                  onClick={createNewAssessment}
                  disabled={isSaving}
                  className="gap-2 bg-transparent"
                >
                  <Plus className="h-4 w-4" />
                  Neue Bewertung
                </Button>
                <Button variant="outline" onClick={() => setShowHistoryDialog(true)} className="gap-2">
                  <History className="h-4 w-4" />
                </Button>
                <Button variant="ghost" onClick={loadPermaData} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* PERMA-V Dimensions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {permaVModel.map((dimension) => (
                <Card key={dimension.key} className={`border ${dimension.lightColor}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`rounded-full p-2 ${dimension.color} text-white`}>{dimension.icon}</div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span className={`text-2xl font-bold ${dimension.textColor}`}>{dimension.letter}</span>
                            {dimension.title}
                          </CardTitle>
                          <CardDescription>{dimension.subtitle}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">{dimension.description}</p>

                    {/* Score display */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Ihr Score</span>
                        <span className={`text-2xl font-bold ${getScoreColor(dimension.score)}`}>
                          {dimension.score}%
                        </span>
                      </div>
                      <Progress value={dimension.score} className="h-3" />

                      {/* Practice average comparison */}
                      {dimension.average !== undefined && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Praxis-Durchschnitt: {dimension.average}%</span>
                          {dimension.score > dimension.average ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-xs">
                              +{dimension.score - dimension.average}%
                            </Badge>
                          ) : dimension.score < dimension.average ? (
                            <Badge variant="outline" className="bg-red-50 text-red-700 text-xs">
                              {dimension.score - dimension.average}%
                            </Badge>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* Practices */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Empfohlene Maßnahmen:</h4>
                      <ul className="space-y-1">
                        {dimension.practices.map((practice, index) => (
                          <li key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                            {practice}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action items for this dimension */}
                    {actionItems.filter((item) => item.dimension === dimension.dbKey).length > 0 && (
                      <div className="space-y-2 pt-2 border-t">
                        <h4 className="text-sm font-medium">Ihre Maßnahmen:</h4>
                        {actionItems
                          .filter((item) => item.dimension === dimension.dbKey)
                          .map((item) => (
                            <div key={item.id} className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50">
                              <button onClick={() => toggleActionItemStatus(item.id)} className="flex-shrink-0">
                                {item.status === "completed" ? (
                                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-amber-500" />
                                )}
                              </button>
                              <span className={item.status === "completed" ? "line-through text-muted-foreground" : ""}>
                                {item.title}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recommendations based on scores */}
            <Card>
              <CardHeader>
                <CardTitle>Handlungsempfehlungen</CardTitle>
                <CardDescription>
                  Basierend auf Ihren PERMA-V Scores empfehlen wir folgende nächste Schritte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {permaVModel
                    .filter((d) => d.score < 70)
                    .sort((a, b) => a.score - b.score)
                    .slice(0, 3)
                    .map((dimension) => (
                      <div key={dimension.key} className="flex items-start gap-4 p-4 rounded-lg border">
                        <div className={`rounded-full p-2 ${dimension.color} text-white flex-shrink-0`}>
                          {dimension.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{dimension.title} verbessern</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            Ihr aktueller Score von {dimension.score}% zeigt Verbesserungspotenzial. Fokussieren Sie
                            sich auf: {dimension.practices[0].toLowerCase()}.
                          </p>
                        </div>
                        <Badge className={getScoreBadge(dimension.score).className}>{dimension.score}%</Badge>
                      </div>
                    ))}
                  {permaVModel.filter((d) => d.score < 70).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
                      <p>Großartig! Alle Ihre PERMA-V Dimensionen sind im guten Bereich.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>PERMA-V Bewertung bearbeiten</DialogTitle>
            <DialogDescription>Bewerten Sie jede Dimension auf einer Skala von 0-100</DialogDescription>
          </DialogHeader>

          {editingScores && (
            <div className="space-y-6 py-4">
              {permaVModel.map((dimension) => (
                <div key={dimension.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <span className={`font-bold ${dimension.textColor}`}>{dimension.letter}</span>
                      {dimension.title}
                    </Label>
                    <span className="font-medium">{editingScores[dimension.key as keyof PermaScores]}%</span>
                  </div>
                  <Slider
                    value={[editingScores[dimension.key as keyof PermaScores]]}
                    onValueChange={([value]) => {
                      setEditingScores({
                        ...editingScores,
                        [dimension.key]: value,
                      })
                    }}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}

              <div className="space-y-2">
                <Label>Notizen</Label>
                <Textarea
                  value={assessmentNotes}
                  onChange={(e) => setAssessmentNotes(e.target.value)}
                  placeholder="Optionale Notizen zu Ihrer Bewertung..."
                  rows={3}
                />
              </div>

              {/* Action items section */}
              <div className="space-y-4 border-t pt-4">
                <Label>Maßnahmen hinzufügen</Label>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={newActionItem.dimension}
                      onValueChange={(value) => setNewActionItem({ ...newActionItem, dimension: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Dimension" />
                      </SelectTrigger>
                      <SelectContent>
                        {dimensionOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={newActionItem.priority}
                      onValueChange={(value) =>
                        setNewActionItem({ ...newActionItem, priority: value as "low" | "medium" | "high" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Priorität" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Niedrig</SelectItem>
                        <SelectItem value="medium">Mittel</SelectItem>
                        <SelectItem value="high">Hoch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newActionItem.title || ""}
                      onChange={(e) => setNewActionItem({ ...newActionItem, title: e.target.value })}
                      placeholder="Maßnahme beschreiben..."
                      className="flex-1 px-3 py-2 border rounded-md text-sm"
                    />
                    <Button onClick={addActionItem} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Existing action items */}
                {actionItems.length > 0 && (
                  <div className="space-y-2">
                    {actionItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                        <button onClick={() => toggleActionItemStatus(item.id)}>
                          {item.status === "completed" ? (
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          )}
                        </button>
                        <span
                          className={`flex-1 text-sm ${item.status === "completed" ? "line-through text-muted-foreground" : ""}`}
                        >
                          {item.title}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {dimensionOptions.find((d) => d.value === item.dimension)?.label}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={savePermaAssessment} disabled={isSaving}>
              {isSaving ? "Speichern..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              PERMA-V Verlauf
            </DialogTitle>
            <DialogDescription>Ihre vergangenen Bewertungen</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {assessmentHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Noch keine Bewertungen vorhanden</p>
              </div>
            ) : (
              assessmentHistory.map((assessment) => {
                const avgScore = Math.round(
                  (assessment.positive_emotions +
                    assessment.engagement +
                    assessment.relationships +
                    assessment.meaning +
                    assessment.accomplishment +
                    assessment.vitality) /
                    6,
                )
                return (
                  <div key={assessment.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(new Date(assessment.assessment_date), "dd. MMMM yyyy", { locale: de })}
                        </span>
                      </div>
                      <Badge className={getScoreBadge(avgScore).className}>{avgScore}%</Badge>
                    </div>
                    <div className="grid grid-cols-6 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-bold text-amber-600">P</div>
                        <div>{assessment.positive_emotions}%</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-orange-600">E</div>
                        <div>{assessment.engagement}%</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-rose-600">R</div>
                        <div>{assessment.relationships}%</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-indigo-600">M</div>
                        <div>{assessment.meaning}%</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-emerald-600">A</div>
                        <div>{assessment.accomplishment}%</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-teal-600">V</div>
                        <div>{assessment.vitality}%</div>
                      </div>
                    </div>
                    {assessment.notes && (
                      <p className="mt-2 text-sm text-muted-foreground border-t pt-2">{assessment.notes}</p>
                    )}
                  </div>
                )
              })
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
