"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Edit2,
  Trash2,
  Copy,
  ExternalLink,
  BarChart3,
  Users,
  Calendar,
  Sparkles,
  FileText,
  Eye,
  Link2,
  ClipboardCheck,
  Loader2,
  Clock,
  Bell,
  Archive,
  Target,
  LayoutTemplate,
  MessageSquare,
  TrendingUp,
  Heart,
  Zap,
  Pause,
  PlayCircle,
  PauseCircle,
  LineChart,
  TrendingDown,
} from "lucide-react"
import { AppLayout } from "@/components/app-layout"
import { cn } from "@/lib/utils" // Import cn for conditional styling
import { Progress } from "@/components/ui/progress"

// Import charting libraries
import {
  LineChart as RechartsLineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { format, parseISO, isBefore, isAfter, differenceInDays } from "date-fns" // Import date utility functions
import { de } from "date-fns/locale" // Import German locale for date formatting

// ... existing code for interfaces ...

interface Survey {
  id: string
  title: string
  description: string | null
  status: "draft" | "active" | "closed" | "archived" // Added 'archived' status
  target_audience: "all" | "team" | "patients" | "anonymous" | "specific" // Added 'specific'
  start_date: string | null
  end_date: string | null
  public_token: string
  created_at: string
  response_count?: number
  notify_admin_on_response?: boolean
  is_anonymous?: boolean // Added for clarity
}

interface SurveyQuestion {
  id?: string
  question_text: string
  question_type: "scale" | "single_choice" | "multiple_choice" | "text" | "yes_no" | "rating"
  options?: string[]
  is_required: boolean
  order_index: number
}

interface SurveyTemplate {
  id: string
  name: string
  description: string
  category: string
  questions: SurveyQuestion[]
  is_system_template?: boolean // Added for system templates
}

// Added interfaces for team mood tracking
interface MoodTrendData {
  week: string
  weekLabel: string
  morale: number
  stress: number
  satisfaction: number
  responseCount: number
}

interface MoodAlert {
  id: string
  type: "warning" | "critical"
  dimension: string
  message: string
  value: number
  trend: "down" | "stable"
  date: string
}

// Add missing icons to statusConfig and audienceConfig
const statusConfig = {
  draft: { label: "Entwurf", color: "bg-gray-100 text-gray-700", icon: FileText },
  active: { label: "Aktiv", color: "bg-emerald-100 text-emerald-700", icon: Bell }, // Changed to Bell for active
  closed: { label: "Beendet", color: "bg-amber-100 text-amber-700", icon: Clock }, // Changed to Clock for closed
  archived: { label: "Archiviert", color: "bg-slate-100 text-slate-700", icon: Archive },
}

const audienceConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  all: { label: "Alle Mitarbeiter", icon: Users },
  team: { label: "Team", icon: Users },
  specific: { label: "Ausgewählte Benutzer", icon: Target },
  anonymous: { label: "Anonym", icon: Eye },
  patients: { label: "Patienten (Extern)", icon: ExternalLink },
}

export default function SurveysPage() {
  const router = useRouter()
  const { currentPractice } = usePractice()
  const { currentUser } = useUser()
  const { toast } = useToast()

  const [surveys, setSurveys] = useState<Survey[]>([])
  const [templates, setTemplates] = useState<SurveyTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showAIDialog, setShowAIDialog] = useState(false)
  const [showResultsDialog, setShowResultsDialog] = useState(false)
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [aiPrompt, setAIPrompt] = useState("")
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  // Added team mood tracking state
  const [showMoodDashboard, setShowMoodDashboard] = useState(false)
  const [moodTrendData, setMoodTrendData] = useState<MoodTrendData[]>([])
  const [moodAlerts, setMoodAlerts] = useState<MoodAlert[]>([])
  const [isLoadingMoodData, setIsLoadingMoodData] = useState(false)
  const [selectedMoodPeriod, setSelectedMoodPeriod] = useState<"4weeks" | "8weeks" | "12weeks">("8weeks")

  const [newSurvey, setNewSurvey] = useState({
    title: "",
    description: "",
    survey_type: "internal" as const,
    target_audience: "all" as const,
    is_anonymous: false,
    start_date: "",
    end_date: "",
    notify_admin_on_response: false, // Added notify admin option
  })

  const fetchSurveys = useCallback(async () => {
    if (!currentPractice?.id) return
    setLoading(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/surveys`, {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setSurveys(data.surveys || [])
      }
    } catch (error) {
      console.error("Error fetching surveys:", error)
    } finally {
      setLoading(false)
    }
  }, [currentPractice?.id])

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch("/api/survey-templates", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
    }
  }, [])

  // Added fetch mood data function
  const fetchMoodData = useCallback(async () => {
    if (!currentPractice?.id) return
    setIsLoadingMoodData(true)
    try {
      const response = await fetch(
        `/api/practices/${currentPractice.id}/surveys/mood-tracking?period=${selectedMoodPeriod}`,
        { credentials: "include" },
      )
      if (response.ok) {
        const data = await response.json()
        setMoodTrendData(data.trends || [])
        setMoodAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error("Error fetching mood data:", error)
    } finally {
      setIsLoadingMoodData(false)
    }
  }, [currentPractice?.id, selectedMoodPeriod])

  useEffect(() => {
    fetchSurveys()
    fetchTemplates()
  }, [fetchSurveys, fetchTemplates])

  useEffect(() => {
    if (showMoodDashboard) {
      fetchMoodData()
    }
  }, [showMoodDashboard, fetchMoodData])

  const handleCreateSurvey = async () => {
    if (!currentPractice?.id || !newSurvey.title.trim()) return
    setIsCreating(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/surveys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newSurvey),
      })
      if (response.ok) {
        const data = await response.json()
        toast({ title: "Umfrage erstellt", description: "Die Umfrage wurde erfolgreich erstellt." })
        setShowCreateDialog(false)
        setNewSurvey({
          title: "",
          description: "",
          survey_type: "internal",
          target_audience: "all",
          is_anonymous: false,
          start_date: "",
          end_date: "",
          notify_admin_on_response: false, // Reset notify admin option
        })
        router.push(`/surveys/${data.survey.id}/edit`)
      } else {
        throw new Error("Failed to create survey")
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Die Umfrage konnte nicht erstellt werden.", variant: "destructive" })
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateFromTemplate = async (template: SurveyTemplate) => {
    console.log("[v0] handleCreateFromTemplate called with template:", template.name)
    console.log("[v0] currentPractice:", currentPractice)

    if (!currentPractice?.id) {
      console.log("[v0] No practice selected, cannot create survey")
      toast({
        title: "Keine Praxis ausgewählt",
        description: "Bitte wählen Sie zuerst eine Praxis aus.",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    console.log("[v0] Creating survey from template...")

    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/surveys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: template.name,
          description: template.description,
          survey_type: template.category === "patient" ? "external" : "internal",
          target_audience: template.category === "patient" ? "patients" : "all",
          is_anonymous: template.category === "patient",
          questions: template.questions,
        }),
      })

      console.log("[v0] Response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Survey created successfully:", data.survey.id)
        toast({ title: "Umfrage erstellt", description: "Die Umfrage wurde aus der Vorlage erstellt." })
        setShowTemplateDialog(false)
        router.push(`/surveys/${data.survey.id}/edit`)
      } else {
        const errorData = await response.text()
        console.log("[v0] Error response:", errorData)
        toast({
          title: "Fehler",
          description: `Die Umfrage konnte nicht erstellt werden: ${response.status}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error creating survey:", error)
      toast({ title: "Fehler", description: "Die Umfrage konnte nicht erstellt werden.", variant: "destructive" })
    } finally {
      setIsCreating(false)
    }
  }

  // Added create weekly mood survey function
  const handleCreateWeeklyMoodSurvey = async () => {
    if (!currentPractice?.id) return
    setIsCreating(true)
    try {
      const today = new Date()
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)

      const response = await fetch(`/api/practices/${currentPractice.id}/surveys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: `Team Stimmungsbarometer - KW ${getWeekNumber(today)}`,
          description: "Wöchentliche Kurzumfrage zur Team-Stimmung",
          survey_type: "internal",
          target_audience: "all",
          is_anonymous: true,
          start_date: today.toISOString().split("T")[0],
          end_date: nextWeek.toISOString().split("T")[0],
          notify_admin_on_response: true,
          questions: [
            {
              question_text: "Wie zufrieden bist du diese Woche mit deiner Arbeit?",
              question_type: "scale",
              is_required: true,
              order_index: 1, // Corrected from display_order
              min_value: 1,
              max_value: 5,
              scale_labels: { "1": "Sehr unzufrieden", "3": "Neutral", "5": "Sehr zufrieden" },
            },
            {
              question_text: "Wie hoch ist dein aktuelles Stresslevel?",
              question_type: "scale",
              is_required: true,
              order_index: 2, // Corrected from display_order
              min_value: 1,
              max_value: 5,
              scale_labels: { "1": "Sehr niedrig", "3": "Mittel", "5": "Sehr hoch" },
            },
            {
              question_text: "Wie gut fühlst du dich im Team unterstützt?",
              question_type: "scale",
              is_required: true,
              order_index: 3, // Corrected from display_order
              min_value: 1,
              max_value: 5,
              scale_labels: { "1": "Gar nicht", "3": "Teilweise", "5": "Sehr gut" },
            },
          ],
        }),
      })
      if (response.ok) {
        toast({
          title: "Stimmungsbarometer erstellt",
          description: "Die wöchentliche Umfrage wurde erstellt und ist jetzt aktiv.",
        })
        fetchSurveys()
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Die Umfrage konnte nicht erstellt werden.", variant: "destructive" })
    } finally {
      setIsCreating(false)
    }
  }

  const handleGenerateWithAI = async () => {
    if (!currentPractice?.id || !aiPrompt.trim()) return
    setIsGeneratingAI(true)
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/surveys/ai-generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt: aiPrompt }),
      })
      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Umfrage generiert",
          description: "Die KI hat eine Umfrage basierend auf Ihrer Beschreibung erstellt.",
        })
        setShowAIDialog(false)
        setAIPrompt("")
        router.push(`/surveys/${data.survey.id}/edit`)
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Die Umfrage konnte nicht generiert werden.", variant: "destructive" })
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleDeleteSurvey = async (surveyId: string) => {
    if (!currentPractice?.id) return
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/surveys/${surveyId}`, {
        method: "DELETE",
        credentials: "include",
      })
      if (response.ok) {
        setSurveys(surveys.filter((s) => s.id !== surveyId))
        toast({ title: "Umfrage gelöscht", description: "Die Umfrage wurde erfolgreich gelöscht." })
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Die Umfrage konnte nicht gelöscht werden.", variant: "destructive" })
    }
  }

  const handleDuplicateSurvey = async (survey: Survey) => {
    if (!currentPractice?.id) return
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/surveys/${survey.id}/duplicate`, {
        method: "POST",
        credentials: "include",
      })
      if (response.ok) {
        toast({ title: "Umfrage dupliziert", description: "Die Umfrage wurde erfolgreich dupliziert." })
        fetchSurveys()
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Die Umfrage konnte nicht dupliziert werden.", variant: "destructive" })
    }
  }

  const handleToggleStatus = async (survey: Survey) => {
    if (!currentPractice?.id) return
    const newStatus = survey.status === "active" ? "closed" : "active"
    try {
      const response = await fetch(`/api/practices/${currentPractice.id}/surveys/${survey.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        setSurveys(surveys.map((s) => (s.id === survey.id ? { ...s, status: newStatus } : s)))
        toast({ title: newStatus === "active" ? "Umfrage aktiviert" : "Umfrage beendet" })
      }
    } catch (error) {
      toast({ title: "Fehler", variant: "destructive" })
    }
  }

  const copyPublicLink = (survey: Survey) => {
    if (survey.public_token) {
      const url = `${window.location.origin}/survey/${survey.public_token}`
      navigator.clipboard.writeText(url)
      toast({ title: "Link kopiert", description: "Der öffentliche Link wurde in die Zwischenablage kopiert." })
    }
  }

  const filteredSurveys = surveys.filter((survey) => {
    const matchesSearch =
      survey.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      survey.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === "all" || survey.status === activeTab
    return matchesSearch && matchesTab
  })

  const stats = {
    total: surveys.length,
    active: surveys.filter((s) => s.status === "active").length,
    totalResponses: surveys.reduce((sum, s) => sum + (s.response_count || 0), 0), // Handle undefined response_count
    avgResponseRate:
      surveys.length > 0
        ? Math.round(surveys.reduce((sum, s) => sum + (s.response_count || 0), 0) / surveys.length)
        : 0, // Handle undefined response_count
  }

  const getSurveyTimeStatus = (survey: Survey) => {
    if (!survey.start_date && !survey.end_date) return null
    const now = new Date()
    if (survey.start_date && isBefore(now, parseISO(survey.start_date))) {
      return { label: `Startet in ${differenceInDays(parseISO(survey.start_date), now)} Tagen`, color: "text-blue-600" }
    }
    if (survey.end_date && isAfter(now, parseISO(survey.end_date))) {
      return { label: "Abgelaufen", color: "text-red-600" }
    }
    if (survey.end_date) {
      const daysLeft = differenceInDays(parseISO(survey.end_date), now)
      return { label: `Noch ${daysLeft} Tage`, color: daysLeft <= 3 ? "text-amber-600" : "text-emerald-600" }
    }
    return null
  }

  // Helper function to get week number
  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  }

  // Calculate mood averages for dashboard
  const moodAverages = useMemo(() => {
    if (moodTrendData.length === 0) return { morale: 0, stress: 0, satisfaction: 0 }
    const sum = moodTrendData.reduce(
      (acc, d) => ({
        morale: acc.morale + d.morale,
        stress: acc.stress + d.stress,
        satisfaction: acc.satisfaction + d.satisfaction,
      }),
      { morale: 0, stress: 0, satisfaction: 0 },
    )
    return {
      morale: sum.morale / moodTrendData.length,
      stress: sum.stress / moodTrendData.length,
      satisfaction: sum.satisfaction / moodTrendData.length,
    }
  }, [moodTrendData])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              Umfragen
            </h1>
            <p className="text-muted-foreground mt-1">
              Erstellen und verwalten Sie Umfragen für Ihr Team und Ihre Patienten
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAIDialog(true)}
              className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 hover:border-violet-300"
            >
              <Sparkles className="h-4 w-4 mr-2 text-violet-600" />
              Mit KI erstellen
            </Button>
            <Button variant="outline" onClick={() => setShowTemplateDialog(true)}>
              <LayoutTemplate className="h-4 w-4 mr-2" />
              Aus Vorlage
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Neue Umfrage
            </Button>
          </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 to-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt</p>
                  <p className="text-2xl font-bold text-violet-700">{stats.total}</p>
                </div>
                <div className="p-3 rounded-xl bg-violet-100">
                  <FileText className="h-5 w-5 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Aktiv</p>
                  <p className="text-2xl font-bold text-emerald-700">{stats.active}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-100">
                  <Bell className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Antworten</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.totalResponses}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-100">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ø Antworten</p>
                  <p className="text-2xl font-bold text-amber-700">{stats.avgResponseRate}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-100">
                  <TrendingUp className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Tabs and Search - Full Width */}
        <div className="border-y bg-muted/30">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto gap-1">
                  <TabsTrigger value="all">Alle</TabsTrigger>
                  <TabsTrigger value="draft">Entwürfe</TabsTrigger>
                  <TabsTrigger value="active">Aktiv</TabsTrigger>
                  <TabsTrigger value="closed">Beendet</TabsTrigger>
                  <TabsTrigger value="archived">Archiv</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Umfrage suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8">

        {/* Team Mood Dashboard Toggle and Quick Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 mt-6">
          <div className="flex items-center gap-2">
            <Button
              variant={showMoodDashboard ? "default" : "outline"}
              onClick={() => setShowMoodDashboard(!showMoodDashboard)}
              className="gap-2"
            >
              <Heart className="h-4 w-4" />
              Team Stimmung
              {moodAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {moodAlerts.length}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateWeeklyMoodSurvey}
              disabled={isCreating}
              className="gap-2 bg-transparent"
            >
              <Zap className="h-4 w-4" />
              Wöchentliche Stimmungsumfrage
            </Button>
          </div>
        </div>

        {/* Team Mood Dashboard */}
        {showMoodDashboard && (
          <Card className="mb-6 border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50/50 to-fuchsia-50/50 dark:from-violet-950/30 dark:to-fuchsia-950/30">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Heart className="h-5 w-5 text-rose-500" />
                    Team Stimmungsbarometer
                  </CardTitle>
                  <CardDescription>Trends und Frühwarnsystem für Team-Wohlbefinden</CardDescription>
                </div>
                <Select
                  value={selectedMoodPeriod}
                  onValueChange={(v: "4weeks" | "8weeks" | "12weeks") => setSelectedMoodPeriod(v)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4weeks">4 Wochen</SelectItem>
                    <SelectItem value="8weeks">8 Wochen</SelectItem>
                    <SelectItem value="12weeks">12 Wochen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingMoodData ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
                </div>
              ) : moodTrendData.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground mb-4">Noch keine Stimmungsdaten vorhanden</p>
                  <Button onClick={handleCreateWeeklyMoodSurvey} disabled={isCreating}>
                    <Plus className="h-4 w-4 mr-2" />
                    Erste Stimmungsumfrage erstellen
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Alerts Section */}
                  {moodAlerts.length > 0 && (
                    <div className="space-y-2">
                      {moodAlerts.map((alert) => (
                        <div
                          key={alert.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border",
                            alert.type === "critical"
                              ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
                              : "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
                          )}
                        >
                          <TrendingDown
                            className={cn("h-5 w-5", alert.type === "critical" ? "text-red-600" : "text-amber-600")}
                          />
                          <div className="flex-1">
                            <p
                              className={cn(
                                "font-medium text-sm",
                                alert.type === "critical" ? "text-red-700" : "text-amber-700",
                              )}
                            >
                              {alert.message}
                            </p>
                            <p className="text-xs text-muted-foreground">{alert.date}</p>
                          </div>
                          <Badge variant={alert.type === "critical" ? "destructive" : "outline"}>
                            {alert.value.toFixed(1)}/5
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Survey List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSurveys.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Keine Umfragen gefunden"
                  : activeTab === "all"
                    ? "Noch keine Umfragen erstellt"
                    : `Keine ${activeTab === "draft" ? "Entwürfe" : activeTab === "active" ? "aktiven" : activeTab === "closed" ? "beendeten" : "archivierten"} Umfragen`}
              </p>
              {!searchQuery && activeTab === "all" && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Erste Umfrage erstellen
                </Button>
              )}
            </div>
          ) : (
            filteredSurveys.map((survey) => {
              const timeStatus = getSurveyTimeStatus(survey)
              return (
                <Card key={survey.id} className="flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base leading-snug truncate">{survey.title}</CardTitle>
                        {survey.description && (
                          <CardDescription className="line-clamp-2 text-xs mt-1">
                            {survey.description}
                          </CardDescription>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/surveys/${survey.id}/edit`)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Bearbeiten
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateSurvey(survey)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplizieren
                          </DropdownMenuItem>
                          {survey.public_token && (
                            <DropdownMenuItem onClick={() => copyPublicLink(survey)}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Link kopieren
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteSurvey(survey.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          survey.status === "active"
                            ? "default"
                            : survey.status === "draft"
                              ? "secondary"
                              : "outline"
                        }
                        className={cn(
                          survey.status === "active" && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
                        )}
                      >
                        {survey.status === "active"
                          ? "Aktiv"
                          : survey.status === "draft"
                            ? "Entwurf"
                            : survey.status === "closed"
                              ? "Beendet"
                              : "Archiviert"}
                      </Badge>
                      {survey.survey_type && (
                        <Badge variant="outline" className="text-xs">
                          {survey.survey_type === "internal"
                            ? "Intern"
                            : survey.survey_type === "external"
                              ? "Extern"
                              : "Anonym"}
                        </Badge>
                      )}
                      {survey.is_anonymous && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Eye className="h-3 w-3" />
                          Anonym
                        </Badge>
                      )}
                      {timeStatus && <Badge variant="outline" className={cn("text-xs", timeStatus.color)}>{timeStatus.label}</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pb-3 pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{survey.response_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span className="text-xs">
                            {survey.created_at ? format(parseISO(survey.created_at), "dd.MM.yyyy") : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <div className="px-6 pb-4 flex gap-2">
                    {survey.status === "active" || survey.status === "closed" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedSurvey(survey)
                          setShowResultsDialog(true)
                        }}
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Ergebnisse
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/surveys/${survey.id}/edit`)}
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Bearbeiten
                      </Button>
                    )}
                    <Button
                      variant={survey.status === "active" ? "destructive" : "default"}
                      size="sm"
                      className={cn(
                        "flex-1",
                        survey.status === "active" && "bg-amber-600 hover:bg-amber-700",
                      )}
                      onClick={() => handleToggleStatus(survey)}
                    >
                      {survey.status === "active" ? (
                        <>
                          <PauseCircle className="h-4 w-4 mr-1" />
                          Beenden
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-4 w-4 mr-1" />
                          Aktivieren
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              )
            })
          )}
        </div>
        </div>
      </div>

      {/* Create Survey Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Neue Umfrage erstellen</DialogTitle>
            <DialogDescription>Erstellen Sie eine neue Umfrage für Ihr Team oder Ihre Patienten.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                placeholder="z.B. Mitarbeiterzufriedenheit Q1 2025"
                value={newSurvey.title}
                onChange={(e) => setNewSurvey({ ...newSurvey, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                placeholder="Worum geht es in dieser Umfrage?"
                value={newSurvey.description}
                onChange={(e) => setNewSurvey({ ...newSurvey, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Umfrageart</Label>
                <Select
                  value={newSurvey.survey_type}
                  onValueChange={(value: any) => setNewSurvey({ ...newSurvey, survey_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Intern (Team)</SelectItem>
                    <SelectItem value="external">Extern (Patienten)</SelectItem>
                    <SelectItem value="anonymous">Anonym</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Zielgruppe</Label>
                <Select
                  value={newSurvey.target_audience}
                  onValueChange={(value: any) => setNewSurvey({ ...newSurvey, target_audience: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Mitarbeiter</SelectItem>
                    <SelectItem value="specific">Ausgewählte Benutzer</SelectItem>
                    <SelectItem value="patients">Patienten (Extern)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Startdatum (optional)</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={newSurvey.start_date}
                  onChange={(e) => setNewSurvey({ ...newSurvey, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Enddatum (optional)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={newSurvey.end_date}
                  onChange={(e) => setNewSurvey({ ...newSurvey, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label>Anonyme Antworten</Label>
                <p className="text-sm text-muted-foreground">
                  Antworten werden ohne Benutzeridentifikation gespeichert
                </p>
              </div>
              <Switch
                checked={newSurvey.is_anonymous}
                onCheckedChange={(checked) => setNewSurvey({ ...newSurvey, is_anonymous: checked })}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-violet-200 bg-violet-50/50 p-4">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-violet-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
                  </svg>
                  Admin benachrichtigen
                </Label>
                <p className="text-sm text-muted-foreground">
                  Super-Admins erhalten eine E-Mail bei jeder neuen Antwort
                </p>
              </div>
              <Switch
                checked={newSurvey.notify_admin_on_response}
                onCheckedChange={(checked) => setNewSurvey({ ...newSurvey, notify_admin_on_response: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleCreateSurvey} disabled={!newSurvey.title.trim() || isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Selection Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vorlage auswählen</DialogTitle>
            <DialogDescription>Wählen Sie eine vorgefertigte Vorlage für Ihre Umfrage.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="grid gap-4 py-4">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer hover:border-violet-300 hover:shadow-md transition-all ${isCreating ? "opacity-50 pointer-events-none" : ""}`}
                  onClick={() => handleCreateFromTemplate(template)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {template.name}
                          {template.is_system_template && (
                            <Badge variant="secondary" className="text-xs">
                              System
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </div>
                      <Badge variant="outline">{template.questions.length} Fragen</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {template.questions.slice(0, 3).map((q, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-normal">
                          {q.question_text.substring(0, 40)}...
                        </Badge>
                      ))}
                      {template.questions.length > 3 && (
                        <Badge variant="secondary" className="text-xs font-normal">
                          +{template.questions.length - 3} weitere
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {isCreating && (
                <div className="flex items-center justify-center p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
                    Umfrage wird erstellt...
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* AI Generation Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600" />
              Umfrage mit KI erstellen
            </DialogTitle>
            <DialogDescription>
              Beschreiben Sie, was Sie mit Ihrer Umfrage erreichen möchten, und die KI erstellt passende Fragen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ihre Beschreibung</Label>
              <Textarea
                placeholder="z.B. Ich möchte herausfinden, wie zufrieden mein Team mit den Arbeitszeiten ist und ob es Verbesserungsvorschläge für die Praxisorganisation gibt..."
                value={aiPrompt}
                onChange={(e) => setAIPrompt(e.target.value)}
                rows={5}
              />
            </div>
            <div className="rounded-lg bg-violet-50 p-4 space-y-2">
              <p className="text-sm font-medium text-violet-700">Tipps für gute Ergebnisse:</p>
              <ul className="text-sm text-violet-600 space-y-1 list-disc list-inside">
                <li>Beschreiben Sie das Ziel der Umfrage</li>
                <li>Nennen Sie die Zielgruppe (Team, Patienten, etc.)</li>
                <li>Erwähnen Sie spezifische Themen, die abgefragt werden sollen</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleGenerateWithAI}
              disabled={!aiPrompt.trim() || isGeneratingAI}
              className="bg-gradient-to-r from-violet-600 to-purple-600"
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generiere...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generieren
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Umfrageergebnisse: {selectedSurvey?.title}</DialogTitle>
            <DialogDescription>{selectedSurvey?.response_count || 0} Antworten erhalten</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Detaillierte Ergebnisansicht wird geladen...</p>
              <Button className="mt-4" onClick={() => router.push(`/surveys/${selectedSurvey?.id}/results`)}>
                Vollständige Analyse öffnen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
