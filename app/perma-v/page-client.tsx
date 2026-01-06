"use client"

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
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import {
  Smile,
  Zap,
  Users,
  Target,
  Award,
  Heart,
  Edit3,
  Plus,
  History,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Lightbulb,
  Brain,
  BarChart3,
  Calendar,
  ChevronRight,
  Sparkles,
  MessageSquare,
  LineChart,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Area,
  AreaChart,
} from "recharts"

// PERMA-V dimension types
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
  assessment_type: string
  notes: string | null
  action_items: ActionItem[]
  assessment_date: string
  created_at: string
}

interface ActionItem {
  id: string
  title: string
  dimension: string
  status: "pending" | "in_progress" | "completed"
  dueDate?: string
  priority: "low" | "medium" | "high"
  notes?: string
}

interface TeamMemberScore {
  userId: string
  name: string
  avatar?: string
  scores: PermaScores
  trend: "up" | "down" | "stable"
  lastAssessment: string
}

export default function PermaVPageClient() {
  const { currentUser, loading: userLoading } = useUser()
  const { currentPractice, isLoading: practiceLoading } = usePractice()

  const [isLoading, setIsLoading] = useState(true)
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
  const [teamScores, setTeamScores] = useState<TeamMemberScore[]>([])
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [showNewAssessmentDialog, setShowNewAssessmentDialog] = useState(false)
  const [showActionDialog, setShowActionDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [assessmentNotes, setAssessmentNotes] = useState("")
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null)
  const [newActionItem, setNewActionItem] = useState<Partial<ActionItem>>({
    title: "",
    dimension: "",
    priority: "medium",
    status: "pending",
  })

  // PERMA-V Model definition
  const permaVModel = [
    {
      key: "positiveEmotions",
      dbKey: "positive_emotions",
      letter: "P",
      title: "Positive Emotionen",
      subtitle: "Positive Emotions",
      description: "Freude, Dankbarkeit, Hoffnung und Zufriedenheit im Arbeitsalltag fördern",
      longDescription:
        "Positive Emotionen sind der Grundstein für Wohlbefinden am Arbeitsplatz. Sie umfassen Gefühle wie Freude, Interesse, Zufriedenheit, Dankbarkeit, Hoffnung und Heiterkeit. Diese Emotionen erweitern unser Denken und fördern kreative Problemlösungen.",
      icon: <Smile className="h-6 w-6" />,
      color: "bg-amber-500",
      lightColor: "bg-amber-50 border-amber-200",
      textColor: "text-amber-600",
      gradientFrom: "from-amber-400",
      gradientTo: "to-orange-500",
      score: permaScores.positiveEmotions,
      average: practiceAverages?.positiveEmotions,
      practices: [
        { title: "Tägliche Erfolge würdigen", impact: "hoch" },
        { title: "Positives Feedback geben", impact: "hoch" },
        { title: "Humor am Arbeitsplatz zulassen", impact: "mittel" },
        { title: "Dankbarkeitsrituale einführen", impact: "mittel" },
        { title: "Kleine Erfolge feiern", impact: "hoch" },
      ],
      questions: [
        "Wie oft erleben Sie positive Emotionen bei der Arbeit?",
        "Fühlen Sie sich in Ihrem Team wertgeschätzt?",
        "Können Sie sich auf die positiven Aspekte Ihrer Arbeit konzentrieren?",
      ],
    },
    {
      key: "engagement",
      dbKey: "engagement",
      letter: "E",
      title: "Engagement",
      subtitle: "Flow & Involvement",
      description: "Tiefes Eintauchen in Aufgaben und volle Konzentration ermöglichen",
      longDescription:
        "Engagement beschreibt den Zustand völliger Absorption in einer Aktivität - den sogenannten 'Flow'. In diesem Zustand vergessen wir die Zeit und sind voll auf das konzentriert, was wir tun. Es entsteht, wenn unsere Fähigkeiten optimal gefordert werden.",
      icon: <Zap className="h-6 w-6" />,
      color: "bg-orange-500",
      lightColor: "bg-orange-50 border-orange-200",
      textColor: "text-orange-600",
      gradientFrom: "from-orange-400",
      gradientTo: "to-red-500",
      score: permaScores.engagement,
      average: practiceAverages?.engagement,
      practices: [
        { title: "Stärken gezielt einsetzen", impact: "hoch" },
        { title: "Herausfordernde Aufgaben vergeben", impact: "hoch" },
        { title: "Autonomie gewähren", impact: "hoch" },
        { title: "Unterbrechungen minimieren", impact: "mittel" },
        { title: "Flow-Zeiten einplanen", impact: "mittel" },
      ],
      questions: [
        "Wie oft erleben Sie Flow-Zustände bei der Arbeit?",
        "Werden Ihre Stärken im Job genutzt?",
        "Haben Sie genug Autonomie bei Ihrer Arbeit?",
      ],
    },
    {
      key: "relationships",
      dbKey: "relationships",
      letter: "R",
      title: "Beziehungen",
      subtitle: "Positive Relationships",
      description: "Vertrauensvolle und unterstützende Beziehungen im Team aufbauen",
      longDescription:
        "Positive Beziehungen sind essentiell für unser Wohlbefinden. Menschen sind soziale Wesen und brauchen Verbindungen zu anderen. Gute Beziehungen am Arbeitsplatz erhöhen nicht nur die Zufriedenheit, sondern auch die Produktivität und Kreativität.",
      icon: <Users className="h-6 w-6" />,
      color: "bg-rose-500",
      lightColor: "bg-rose-50 border-rose-200",
      textColor: "text-rose-600",
      gradientFrom: "from-rose-400",
      gradientTo: "to-pink-500",
      score: permaScores.relationships,
      average: practiceAverages?.relationships,
      practices: [
        { title: "Regelmäßige Team-Events", impact: "hoch" },
        { title: "Aktives Zuhören praktizieren", impact: "hoch" },
        { title: "Konflikte konstruktiv lösen", impact: "hoch" },
        { title: "Mentoring-Programme anbieten", impact: "mittel" },
        { title: "Gemeinsame Pausen fördern", impact: "mittel" },
      ],
      questions: [
        "Wie gut sind Ihre Beziehungen zu Kollegen?",
        "Fühlen Sie sich vom Team unterstützt?",
        "Gibt es Vertrauen im Team?",
      ],
    },
    {
      key: "meaning",
      dbKey: "meaning",
      letter: "M",
      title: "Sinn",
      subtitle: "Meaning & Purpose",
      description: "Den größeren Zweck der Arbeit vermitteln und Sinnhaftigkeit stärken",
      longDescription:
        "Sinn bedeutet, Teil von etwas Größerem zu sein als man selbst. Wenn wir unsere Arbeit als sinnvoll empfinden, sind wir motivierter und widerstandsfähiger gegen Stress. In der Medizin liegt der Sinn oft im Dienst am Patienten.",
      icon: <Target className="h-6 w-6" />,
      color: "bg-indigo-500",
      lightColor: "bg-indigo-50 border-indigo-200",
      textColor: "text-indigo-600",
      gradientFrom: "from-indigo-400",
      gradientTo: "to-purple-500",
      score: permaScores.meaning,
      average: practiceAverages?.meaning,
      practices: [
        { title: "Vision und Mission kommunizieren", impact: "hoch" },
        { title: "Beitrag zum Ganzen verdeutlichen", impact: "hoch" },
        { title: "Werte leben und vorleben", impact: "hoch" },
        { title: "Patientengeschichten teilen", impact: "mittel" },
        { title: "Purpose-Workshops durchführen", impact: "mittel" },
      ],
      questions: [
        "Empfinden Sie Ihre Arbeit als sinnvoll?",
        "Kennen Sie den größeren Zweck Ihrer Tätigkeit?",
        "Stimmt Ihre Arbeit mit Ihren Werten überein?",
      ],
    },
    {
      key: "accomplishment",
      dbKey: "accomplishment",
      letter: "A",
      title: "Zielerreichung",
      subtitle: "Accomplishment",
      description: "Erfolge feiern und das Gefühl von Kompetenz und Fortschritt fördern",
      longDescription:
        "Das Erreichen von Zielen und der damit verbundene Stolz sind wichtige Treiber von Wohlbefinden. Es geht nicht nur um große Erfolge, sondern auch um das tägliche Gefühl von Fortschritt und Kompetenz.",
      icon: <Award className="h-6 w-6" />,
      color: "bg-emerald-500",
      lightColor: "bg-emerald-50 border-emerald-200",
      textColor: "text-emerald-600",
      gradientFrom: "from-emerald-400",
      gradientTo: "to-green-500",
      score: permaScores.accomplishment,
      average: practiceAverages?.accomplishment,
      practices: [
        { title: "Klare Ziele definieren", impact: "hoch" },
        { title: "Meilensteine feiern", impact: "hoch" },
        { title: "Fortschritte sichtbar machen", impact: "mittel" },
        { title: "Entwicklungsmöglichkeiten bieten", impact: "hoch" },
        { title: "Feedback-Kultur etablieren", impact: "mittel" },
      ],
      questions: [
        "Erreichen Sie regelmäßig Ihre Ziele?",
        "Werden Ihre Erfolge anerkannt?",
        "Haben Sie das Gefühl, sich weiterzuentwickeln?",
      ],
    },
    {
      key: "vitality",
      dbKey: "vitality",
      letter: "V",
      title: "Vitalität",
      subtitle: "Vitality & Health",
      description: "Körperliche und geistige Gesundheit als Grundlage für Leistung",
      longDescription:
        "Vitalität umfasst körperliche Energie, Gesundheit und ein allgemeines Gefühl von Lebendigkeit. Sie ist die biologische Grundlage für alle anderen PERMA-Elemente. Ohne ausreichend Energie und Gesundheit können wir unser Potenzial nicht ausschöpfen.",
      icon: <Heart className="h-6 w-6" />,
      color: "bg-teal-500",
      lightColor: "bg-teal-50 border-teal-200",
      textColor: "text-teal-600",
      gradientFrom: "from-teal-400",
      gradientTo: "to-cyan-500",
      score: permaScores.vitality,
      average: practiceAverages?.vitality,
      practices: [
        { title: "Work-Life-Balance fördern", impact: "hoch" },
        { title: "Pausen aktiv unterstützen", impact: "hoch" },
        { title: "Bewegung am Arbeitsplatz", impact: "mittel" },
        { title: "Stressmanagement-Angebote", impact: "hoch" },
        { title: "Ergonomie optimieren", impact: "mittel" },
      ],
      questions: [
        "Wie ist Ihr Energielevel bei der Arbeit?",
        "Haben Sie eine gute Work-Life-Balance?",
        "Achten Sie auf Ihre körperliche Gesundheit?",
      ],
    },
  ]

  // Calculate overall score
  const overallScore = Math.round(
    Object.values(permaScores).reduce((a, b) => a + b, 0) / Object.values(permaScores).length,
  )

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600"
    if (score >= 60) return "text-amber-600"
    return "text-red-600"
  }

  // Get score badge
  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: "Exzellent", className: "bg-emerald-100 text-emerald-700 border-emerald-200" }
    if (score >= 60) return { label: "Gut", className: "bg-amber-100 text-amber-700 border-amber-200" }
    if (score >= 40)
      return { label: "Verbesserungspotenzial", className: "bg-orange-100 text-orange-700 border-orange-200" }
    return { label: "Kritisch", className: "bg-red-100 text-red-700 border-red-200" }
  }

  // Get trend icon
  const getTrendIcon = (current: number, previous: number | undefined) => {
    if (!previous) return <Minus className="h-4 w-4 text-muted-foreground" />
    const diff = current - previous
    if (diff > 5) return <TrendingUp className="h-4 w-4 text-emerald-500" />
    if (diff < -5) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  // Load PERMA data
  const loadPermaData = useCallback(async () => {
    if (!currentPractice?.id || !currentUser?.id) return

    try {
      const response = await fetch(
        `/api/practices/${currentPractice.id}/perma-assessments?userId=${currentUser.id}&limit=20`,
      )

      if (response.status === 429) {
        console.log("[v0] PERMA assessments rate limited")
        return
      }

      if (!response.ok) {
        throw new Error("Failed to fetch PERMA data")
      }

      const data = await response.json()

      if (data.latestAssessment) {
        setCurrentAssessment(data.latestAssessment)
        setPermaScores({
          positiveEmotions: data.latestAssessment.positive_emotions,
          engagement: data.latestAssessment.engagement,
          relationships: data.latestAssessment.relationships,
          meaning: data.latestAssessment.meaning,
          accomplishment: data.latestAssessment.accomplishment,
          vitality: data.latestAssessment.vitality,
        })
        setActionItems(data.latestAssessment.action_items || [])
      }

      if (data.assessments) {
        setAssessmentHistory(data.assessments)
      }

      if (data.practiceAverages) {
        setPracticeAverages(data.practiceAverages)
      }
    } catch (error) {
      console.error("Error loading PERMA data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [currentPractice?.id, currentUser?.id])

  useEffect(() => {
    if (currentPractice?.id && currentUser?.id) {
      loadPermaData()
    } else if (!userLoading && !practiceLoading) {
      setIsLoading(false)
    }
  }, [currentPractice?.id, currentUser?.id, userLoading, practiceLoading, loadPermaData])

  // Save assessment
  const saveAssessment = async (isNew = false) => {
    if (!currentPractice?.id || !currentUser?.id || !editingScores) return

    setIsSaving(true)
    try {
      const endpoint = `/api/practices/${currentPractice.id}/perma-assessments`
      const method = isNew ? "POST" : "PUT"
      const body = isNew
        ? {
            userId: currentUser.id,
            positiveEmotions: editingScores.positiveEmotions,
            engagement: editingScores.engagement,
            relationships: editingScores.relationships,
            meaning: editingScores.meaning,
            accomplishment: editingScores.accomplishment,
            vitality: editingScores.vitality,
            notes: assessmentNotes,
            actionItems,
          }
        : {
            id: currentAssessment?.id,
            positiveEmotions: editingScores.positiveEmotions,
            engagement: editingScores.engagement,
            relationships: editingScores.relationships,
            meaning: editingScores.meaning,
            accomplishment: editingScores.accomplishment,
            vitality: editingScores.vitality,
            notes: assessmentNotes,
            actionItems,
          }

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error("Failed to save assessment")
      }

      setPermaScores(editingScores)
      setShowEditDialog(false)
      setShowNewAssessmentDialog(false)
      toast.success(isNew ? "Neue PERMA-V Bewertung erstellt" : "PERMA-V Bewertung aktualisiert")
      loadPermaData()
    } catch (error) {
      console.error("Error saving assessment:", error)
      toast.error("Fehler beim Speichern")
    } finally {
      setIsSaving(false)
    }
  }

  // Add action item
  const addActionItem = () => {
    if (!newActionItem.title || !newActionItem.dimension) return

    const item: ActionItem = {
      id: crypto.randomUUID(),
      title: newActionItem.title,
      dimension: newActionItem.dimension,
      status: "pending",
      priority: newActionItem.priority || "medium",
      dueDate: newActionItem.dueDate,
      notes: newActionItem.notes,
    }

    setActionItems([...actionItems, item])
    setNewActionItem({ title: "", dimension: "", priority: "medium", status: "pending" })
    setShowActionDialog(false)
    toast.success("Maßnahme hinzugefügt")
  }

  // Toggle action item status
  const toggleActionStatus = (id: string) => {
    setActionItems(
      actionItems.map((item) =>
        item.id === id ? { ...item, status: item.status === "completed" ? "pending" : "completed" } : item,
      ),
    )
  }

  // Prepare chart data
  const getChartData = () => {
    return assessmentHistory
      .slice(0, 12)
      .reverse()
      .map((assessment) => ({
        date: format(new Date(assessment.assessment_date), "dd.MM", { locale: de }),
        P: assessment.positive_emotions,
        E: assessment.engagement,
        R: assessment.relationships,
        M: assessment.meaning,
        A: assessment.accomplishment,
        V: assessment.vitality,
        Gesamt: Math.round(
          (assessment.positive_emotions +
            assessment.engagement +
            assessment.relationships +
            assessment.meaning +
            assessment.accomplishment +
            assessment.vitality) /
            6,
        ),
      }))
  }

  // Prepare radar chart data
  const getRadarData = () => {
    return permaVModel.map((dim) => ({
      dimension: dim.letter,
      score: dim.score,
      average: dim.average || 0,
      fullMark: 100,
    }))
  }

  // Get weakest dimensions
  const getWeakestDimensions = () => {
    return [...permaVModel].sort((a, b) => a.score - b.score).slice(0, 3)
  }

  // Get strongest dimensions
  const getStrongestDimensions = () => {
    return [...permaVModel].sort((a, b) => b.score - a.score).slice(0, 3)
  }

  if (userLoading || practiceLoading || isLoading) {
    return (
      <AppLayout title="PERMA-V Modell" description="Laden..." loading={true}>
        <div className="flex items-center justify-center h-64">
          {" "}
          {/* Modified loading state */}
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout
      title="PERMA-V Modell"
      description="Implementieren, überwachen und managen Sie das PERMA-V Wohlbefindensmodell"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">PERMA-V Modell</h1>
            <p className="text-muted-foreground">
              Wissenschaftlich fundiertes Wohlbefinden im Team messen und verbessern
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 hover:text-indigo-800 shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
            AI Team Analyse
          </Button>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Übersicht</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
            <TabsTrigger value="perma" className="gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">PERMA-V</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Header Card with Score */}
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                      <Brain className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">PERMA-V Modell</h2>
                      <p className="text-muted-foreground">
                        Das PERMA-V Modell beschreibt die sechs Säulen des Wohlbefindens
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>{overallScore}%</div>
                    <Badge variant="outline" className={getScoreBadge(overallScore).className}>
                      {getScoreBadge(overallScore).label}
                    </Badge>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 mt-6">
                  <Button
                    onClick={() => {
                      setEditingScores({ ...permaScores })
                      setShowEditDialog(true)
                    }}
                    className="gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    Bewertung bearbeiten
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingScores({
                        positiveEmotions: 50,
                        engagement: 50,
                        relationships: 50,
                        meaning: 50,
                        accomplishment: 50,
                        vitality: 50,
                      })
                      setAssessmentNotes("")
                      setShowNewAssessmentDialog(true)
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Neue Bewertung
                  </Button>
                  <Button variant="ghost" onClick={() => setShowHistoryDialog(true)} className="gap-2">
                    <History className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" onClick={loadPermaData} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Row */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-700 font-medium">Stärkste Dimension</p>
                      <p className="text-2xl font-bold text-emerald-800">{getStrongestDimensions()[0]?.title}</p>
                    </div>
                    <div className="p-3 rounded-full bg-emerald-500 text-white">
                      {getStrongestDimensions()[0]?.icon}
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-emerald-600 mt-2">{getStrongestDimensions()[0]?.score}%</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-amber-700 font-medium">Verbesserungspotenzial</p>
                      <p className="text-2xl font-bold text-amber-800">{getWeakestDimensions()[0]?.title}</p>
                    </div>
                    <div className="p-3 rounded-full bg-amber-500 text-white">{getWeakestDimensions()[0]?.icon}</div>
                  </div>
                  <p className="text-3xl font-bold text-amber-600 mt-2">{getWeakestDimensions()[0]?.score}%</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-indigo-700 font-medium">Offene Maßnahmen</p>
                      <p className="text-2xl font-bold text-indigo-800">
                        {actionItems.filter((i) => i.status !== "completed").length} von {actionItems.length}
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-indigo-500 text-white">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                  </div>
                  <Progress
                    value={
                      actionItems.length > 0
                        ? (actionItems.filter((i) => i.status === "completed").length / actionItems.length) * 100
                        : 0
                    }
                    className="mt-3 h-2"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-indigo-500" />
                    PERMA-V Profil
                  </CardTitle>
                  <CardDescription>Ihre aktuelle Bewertung im Überblick</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={getRadarData()}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="dimension" />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar name="Ihr Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                        {practiceAverages && (
                          <Radar
                            name="Praxis-Durchschnitt"
                            dataKey="average"
                            stroke="#94a3b8"
                            fill="#94a3b8"
                            fillOpacity={0.2}
                          />
                        )}
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-emerald-500" />
                    Entwicklung über Zeit
                  </CardTitle>
                  <CardDescription>Gesamtscore der letzten Bewertungen</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {assessmentHistory.length > 1 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getChartData()}>
                          <defs>
                            <linearGradient id="colorGesamt" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="Gesamt"
                            stroke="#6366f1"
                            fill="url(#colorGesamt)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Noch nicht genügend Daten für Trendanalyse</p>
                          <p className="text-sm">Erstellen Sie weitere Bewertungen</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-500" />
                      Maßnahmen & Aktionen
                    </CardTitle>
                    <CardDescription>Ihre geplanten Verbesserungsmaßnahmen</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowActionDialog(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Maßnahme hinzufügen
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {actionItems.length > 0 ? (
                  <div className="space-y-3">
                    {actionItems.map((item) => {
                      const dimension = permaVModel.find((d) => d.dbKey === item.dimension)
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center gap-4 p-4 rounded-lg border ${
                            item.status === "completed" ? "bg-emerald-50 border-emerald-200" : "bg-muted/50"
                          }`}
                        >
                          <button onClick={() => toggleActionStatus(item.id)} className="flex-shrink-0">
                            {item.status === "completed" ? (
                              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                            ) : (
                              <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-medium ${
                                item.status === "completed" ? "line-through text-muted-foreground" : ""
                              }`}
                            >
                              {item.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {dimension && (
                                <Badge variant="outline" className={dimension.lightColor}>
                                  <span className={dimension.textColor}>{dimension.letter}</span>
                                  <span className="ml-1 text-muted-foreground">{dimension.title}</span>
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className={
                                  item.priority === "high"
                                    ? "border-red-200 text-red-700"
                                    : item.priority === "medium"
                                      ? "border-amber-200 text-amber-700"
                                      : "border-slate-200 text-slate-700"
                                }
                              >
                                {item.priority === "high" ? "Hoch" : item.priority === "medium" ? "Mittel" : "Niedrig"}
                              </Badge>
                            </div>
                          </div>
                          {item.dueDate && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(item.dueDate), "dd.MM.yyyy", { locale: de })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Noch keine Maßnahmen geplant</p>
                    <p className="text-sm">Fügen Sie Maßnahmen hinzu, um Ihre PERMA-V Scores zu verbessern</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-500" />
                  Team PERMA-V Übersicht
                </CardTitle>
                <CardDescription>Vergleichen Sie die PERMA-V Scores im Team (anonymisiert)</CardDescription>
              </CardHeader>
              <CardContent>
                {practiceAverages ? (
                  <div className="space-y-6">
                    {/* Team Averages */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {permaVModel.map((dimension) => (
                        <div key={dimension.key} className={`p-4 rounded-lg border ${dimension.lightColor}`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${dimension.color} text-white`}>{dimension.icon}</div>
                            <div className="flex-1">
                              <p className="font-medium">{dimension.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-2xl font-bold ${dimension.textColor}`}>
                                  {dimension.average || 0}%
                                </span>
                                <span className="text-sm text-muted-foreground">Team-Ø</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Ihr Score</p>
                              <p className={`text-lg font-semibold ${getScoreColor(dimension.score)}`}>
                                {dimension.score}%
                              </p>
                            </div>
                          </div>
                          <Progress value={dimension.average || 0} className="mt-3 h-2" />
                        </div>
                      ))}
                    </div>

                    {/* Team Comparison Chart */}
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={getRadarData()}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="dimension" />
                          <PolarRadiusAxis domain={[0, 100]} />
                          <Radar name="Ihr Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
                          <Radar
                            name="Team-Durchschnitt"
                            dataKey="average"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.3}
                          />
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Noch keine Team-Daten verfügbar</p>
                    <p className="text-sm">Team-Durchschnitte werden berechnet, sobald mehrere Bewertungen vorliegen</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PERMA-V Tab */}
          <TabsContent value="perma" className="space-y-6 mt-6">
            {/* PERMA-V Dimension Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {permaVModel.map((dimension) => (
                <Card
                  key={dimension.key}
                  className={`border-2 transition-all hover:shadow-lg cursor-pointer ${dimension.lightColor}`}
                  onClick={() => setSelectedDimension(dimension.key)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${dimension.color} text-white`}>{dimension.icon}</div>
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

                    {/* Score Display */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Ihr Score</span>
                        <span className={`text-3xl font-bold ${getScoreColor(dimension.score)}`}>
                          {dimension.score}%
                        </span>
                      </div>
                      <Progress value={dimension.score} className="h-3" />

                      {/* Practice average comparison */}
                      {dimension.average !== undefined && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Praxis-Durchschnitt: {dimension.average}%</span>
                          {dimension.score > dimension.average ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                              <TrendingUp className="h-3 w-3 mr-1" />+{dimension.score - dimension.average}%
                            </Badge>
                          ) : dimension.score < dimension.average ? (
                            <Badge variant="outline" className="bg-red-50 text-red-700">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              {dimension.score - dimension.average}%
                            </Badge>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* Top practices preview */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-1">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        Top-Empfehlungen
                      </h4>
                      <ul className="space-y-1">
                        {dimension.practices.slice(0, 3).map((practice, index) => (
                          <li key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                            {practice.title}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button variant="ghost" size="sm" className="w-full gap-2">
                      Details ansehen
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  KI-Empfehlungen
                </CardTitle>
                <CardDescription>
                  Basierend auf Ihren PERMA-V Scores empfehlen wir folgende Fokus-Bereiche
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getWeakestDimensions().map((dimension, index) => (
                    <div key={dimension.key} className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30">
                      <div className={`p-3 rounded-xl ${dimension.color} text-white flex-shrink-0`}>
                        {dimension.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            Priorität {index + 1}
                          </Badge>
                          <h4 className="font-semibold">{dimension.title} verbessern</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Ihr aktueller Score von {dimension.score}% zeigt Verbesserungspotenzial.
                          {dimension.score < 50
                            ? " Dieser Bereich sollte priorisiert werden."
                            : " Mit gezielten Maßnahmen können Sie diesen Bereich stärken."}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {dimension.practices.slice(0, 2).map((practice, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {practice.title}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge className={getScoreBadge(dimension.score).className}>{dimension.score}%</Badge>
                    </div>
                  ))}

                  {permaVModel.filter((d) => d.score < 60).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
                      <p className="text-lg font-medium text-foreground">Ausgezeichnet!</p>
                      <p>Alle Ihre PERMA-V Dimensionen sind im guten Bereich.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
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
                <div key={dimension.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <span className={`text-xl font-bold ${dimension.textColor}`}>{dimension.letter}</span>
                      {dimension.title}
                    </Label>
                    <span className="text-xl font-bold">{editingScores[dimension.key as keyof PermaScores]}%</span>
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
                  <p className="text-xs text-muted-foreground">{dimension.description}</p>
                </div>
              ))}

              <div className="space-y-2">
                <Label>Notizen (optional)</Label>
                <Textarea
                  value={assessmentNotes}
                  onChange={(e) => setAssessmentNotes(e.target.value)}
                  placeholder="Fügen Sie Notizen zu dieser Bewertung hinzu..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={() => saveAssessment(false)} disabled={isSaving}>
              {isSaving ? "Speichern..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Assessment Dialog */}
      <Dialog open={showNewAssessmentDialog} onOpenChange={setShowNewAssessmentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neue PERMA-V Bewertung</DialogTitle>
            <DialogDescription>Erstellen Sie eine neue Bewertung Ihres aktuellen Wohlbefindens</DialogDescription>
          </DialogHeader>

          {editingScores && (
            <div className="space-y-6 py-4">
              {permaVModel.map((dimension) => (
                <div key={dimension.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <span className={`text-xl font-bold ${dimension.textColor}`}>{dimension.letter}</span>
                      {dimension.title}
                    </Label>
                    <span className="text-xl font-bold">{editingScores[dimension.key as keyof PermaScores]}%</span>
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
                  <p className="text-xs text-muted-foreground">{dimension.description}</p>
                </div>
              ))}

              <div className="space-y-2">
                <Label>Notizen (optional)</Label>
                <Textarea
                  value={assessmentNotes}
                  onChange={(e) => setAssessmentNotes(e.target.value)}
                  placeholder="Wie fühlen Sie sich heute? Was beeinflusst Ihr Wohlbefinden?"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewAssessmentDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={() => saveAssessment(true)} disabled={isSaving}>
              {isSaving ? "Erstellen..." : "Bewertung erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>PERMA-V Verlauf</DialogTitle>
            <DialogDescription>Ihre bisherigen Bewertungen</DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {assessmentHistory.map((assessment, index) => (
                <Card key={assessment.id} className={index === 0 ? "border-primary" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(new Date(assessment.assessment_date), "dd. MMMM yyyy", {
                            locale: de,
                          })}
                        </span>
                        {index === 0 && <Badge>Aktuell</Badge>}
                      </div>
                      <span className="text-lg font-bold">
                        {Math.round(
                          (assessment.positive_emotions +
                            assessment.engagement +
                            assessment.relationships +
                            assessment.meaning +
                            assessment.accomplishment +
                            assessment.vitality) /
                            6,
                        )}
                        %
                      </span>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {[
                        { key: "P", value: assessment.positive_emotions, color: "bg-amber-500" },
                        { key: "E", value: assessment.engagement, color: "bg-orange-500" },
                        { key: "R", value: assessment.relationships, color: "bg-rose-500" },
                        { key: "M", value: assessment.meaning, color: "bg-indigo-500" },
                        { key: "A", value: assessment.accomplishment, color: "bg-emerald-500" },
                        { key: "V", value: assessment.vitality, color: "bg-teal-500" },
                      ].map((dim) => (
                        <div key={dim.key} className="text-center">
                          <div className={`text-xs font-bold text-white ${dim.color} rounded px-2 py-1`}>{dim.key}</div>
                          <div className="text-sm font-medium mt-1">{dim.value}%</div>
                        </div>
                      ))}
                    </div>
                    {assessment.notes && (
                      <p className="text-sm text-muted-foreground mt-3 italic">"{assessment.notes}"</p>
                    )}
                  </CardContent>
                </Card>
              ))}

              {assessmentHistory.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Noch keine Bewertungen vorhanden</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Add Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Maßnahme hinzufügen</DialogTitle>
            <DialogDescription>
              Planen Sie eine konkrete Maßnahme zur Verbesserung Ihres PERMA-V Scores
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Titel der Maßnahme</Label>
              <Input
                value={newActionItem.title}
                onChange={(e) => setNewActionItem({ ...newActionItem, title: e.target.value })}
                placeholder="z.B. Wöchentliches Team-Meeting einführen"
              />
            </div>

            <div className="space-y-2">
              <Label>PERMA-V Dimension</Label>
              <Select
                value={newActionItem.dimension}
                onValueChange={(value) => setNewActionItem({ ...newActionItem, dimension: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Dimension auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {permaVModel.map((dim) => (
                    <SelectItem key={dim.dbKey} value={dim.dbKey}>
                      <span className={dim.textColor}>{dim.letter}</span> - {dim.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priorität</Label>
              <Select
                value={newActionItem.priority}
                onValueChange={(value) =>
                  setNewActionItem({
                    ...newActionItem,
                    priority: value as "low" | "medium" | "high",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Niedrig</SelectItem>
                  <SelectItem value="medium">Mittel</SelectItem>
                  <SelectItem value="high">Hoch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fälligkeitsdatum (optional)</Label>
              <Input
                type="date"
                value={newActionItem.dueDate || ""}
                onChange={(e) => setNewActionItem({ ...newActionItem, dueDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Notizen (optional)</Label>
              <Textarea
                value={newActionItem.notes || ""}
                onChange={(e) => setNewActionItem({ ...newActionItem, notes: e.target.value })}
                placeholder="Weitere Details zur Maßnahme..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={addActionItem} disabled={!newActionItem.title || !newActionItem.dimension}>
              Hinzufügen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dimension Detail Dialog */}
      <Dialog open={!!selectedDimension} onOpenChange={() => setSelectedDimension(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedDimension && (
            <>
              {(() => {
                const dimension = permaVModel.find((d) => d.key === selectedDimension)
                if (!dimension) return null
                return (
                  <>
                    <DialogHeader>
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${dimension.color} text-white`}>{dimension.icon}</div>
                        <div>
                          <DialogTitle className="flex items-center gap-2">
                            <span className={`text-2xl font-bold ${dimension.textColor}`}>{dimension.letter}</span>
                            {dimension.title}
                          </DialogTitle>
                          <DialogDescription>{dimension.subtitle}</DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                      {/* Score Display */}
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm text-muted-foreground">Ihr aktueller Score</p>
                          <p className={`text-4xl font-bold ${getScoreColor(dimension.score)}`}>{dimension.score}%</p>
                        </div>
                        <Badge className={getScoreBadge(dimension.score).className}>
                          {getScoreBadge(dimension.score).label}
                        </Badge>
                      </div>

                      {/* Description */}
                      <div>
                        <h4 className="font-semibold mb-2">Was bedeutet {dimension.title}?</h4>
                        <p className="text-sm text-muted-foreground">{dimension.longDescription}</p>
                      </div>

                      {/* Practices */}
                      <div>
                        <h4 className="font-semibold mb-3">Empfohlene Maßnahmen</h4>
                        <div className="space-y-2">
                          {dimension.practices.map((practice, index) => (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                              <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                <span>{practice.title}</span>
                              </div>
                              <Badge
                                variant="outline"
                                className={
                                  practice.impact === "hoch"
                                    ? "border-emerald-200 text-emerald-700"
                                    : "border-amber-200 text-amber-700"
                                }
                              >
                                {practice.impact === "hoch" ? "Hoher Impact" : "Mittlerer Impact"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Reflection Questions */}
                      <div>
                        <h4 className="font-semibold mb-3">Reflexionsfragen</h4>
                        <div className="space-y-2">
                          {dimension.questions.map((question, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                              <MessageSquare className="h-5 w-5 text-indigo-500 mt-0.5" />
                              <span className="text-sm">{question}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedDimension(null)
                          setNewActionItem({ ...newActionItem, dimension: dimension.dbKey })
                          setShowActionDialog(true)
                        }}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Maßnahme für {dimension.title} hinzufügen
                      </Button>
                    </DialogFooter>
                  </>
                )
              })()}
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
