"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/contexts/user-context"
import { Button } from "@/components/ui/button"
import { useQualityCircles, useTeamMembersForQuality, createQualityCircleItem, updateQualityCircleItem } from "@/hooks/use-quality-circles"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"
import { format, addDays, isBefore, isAfter } from "date-fns"
import { de } from "date-fns/locale"
import {
  Users,
  Calendar,
  Plus,
  Sparkles,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  ClipboardList,
  MessageSquare,
  Check,
  X,
  Loader2,
} from "lucide-react"

interface Session {
  id: string
  title: string
  description: string | null
  scheduled_date: string
  actual_start: string | null
  actual_end: string | null
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  meeting_type: "regular" | "emergency" | "follow_up" | "annual_review"
  location: string | null
  moderator_id: string | null
  participants?: Participant[]
  agenda_items?: AgendaItem[]
  protocol?: Protocol | null
}

interface Participant {
  id: string
  team_member_id: string
  role: string
  attendance_status: string
  team_member?: { first_name: string; last_name: string }
}

interface Topic {
  id: string
  title: string
  description: string | null
  category: string | null
  priority: "critical" | "high" | "medium" | "low"
  source: string
  relevance_score: number | null
  status: "proposed" | "accepted" | "discussed" | "deferred" | "rejected"
  source_data: any
  created_at: string
}

interface AgendaItem {
  id: string
  title: string
  description: string | null
  duration_minutes: number
  order_index: number
  status: string
  notes: string | null
  topic_id: string | null
}

interface Protocol {
  id: string
  content: string
  ai_summary: string | null
  key_decisions: any[]
  is_draft: boolean
  created_at: string
}

interface Action {
  id: string
  title: string
  description: string | null
  assigned_to: string | null
  due_date: string | null
  priority: "critical" | "high" | "medium" | "low"
  status: "open" | "in_progress" | "completed" | "overdue" | "cancelled"
  completion_notes: string | null
  completed_at: string | null
  session_id: string | null
  assignee?: { first_name: string; last_name: string }
}

interface Benchmark {
  id: string
  category: string
  metric_name: string
  metric_description: string | null
  industry_avg: number
  industry_min: number
  industry_max: number
  top_quartile: number
  unit: string
  practice_score?: number
  percentile?: number
  trend?: "improving" | "stable" | "declining"
}

interface TeamMember {
  id: string
  first_name: string
  last_name: string
  position: string | null
}

export default function QualitaetszirkelPageClient() {
  const { user, practiceId, loading: userLoading } = useUser()
  const [activeTab, setActiveTab] = useState("sessions")
  // SWR hooks for data fetching
  const { sessions, topics, actions, benchmarks, isLoading: swrLoading, mutate } = useQualityCircles(practiceId)
  const { teamMembers } = useTeamMembersForQuality(practiceId)
  
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  // Sync SWR loading state
  useEffect(() => {
    if (!swrLoading) {
      setLoading(false)
    }
  }, [swrLoading])

  // Dialog states
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false)
  const [showNewActionDialog, setShowNewActionDialog] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  // Form states
  const [newSession, setNewSession] = useState({
    title: "",
    description: "",
    scheduled_date: format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm"),
    meeting_type: "regular",
    location: "",
  })

  const [newAction, setNewAction] = useState({
    title: "",
    description: "",
    assigned_to: "",
    due_date: "",
    priority: "medium",
  })

  const generateAITopics = async () => {
    if (!practiceId) {
      toast({
        title: "Fehler",
        description: "Keine Praxis-ID gefunden. Bitte laden Sie die Seite neu.",
        variant: "destructive",
      })
      return
    }

    setGenerating(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/quality-circles/ai-topics`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("Fehler beim Generieren")

      const data = await response.json()
      
      if (data.topics && data.topics.length > 0) {
        // Use API to insert topics
        for (const topic of data.topics) {
          await createQualityCircleItem(practiceId, "topic", {
            ...topic,
            source: "ai_suggested",
          })
        }
        
        mutate()
        toast({
          title: "Themen generiert",
          description: `${data.topics.length} neue Themenvorschläge wurden erstellt.`,
        })
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Themenvorschläge konnten nicht generiert werden.",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const createSession = async () => {
    if (!practiceId) {
      toast({
        title: "Fehler",
        description: "Keine Praxis-ID gefunden. Bitte laden Sie die Seite neu.",
        variant: "destructive",
      })
      return
    }

    try {
      await createQualityCircleItem(practiceId, "session", {
        ...newSession,
        status: "scheduled",
      })

      mutate()
      setShowNewSessionDialog(false)
      setNewSession({
        title: "",
        description: "",
        scheduled_date: format(addDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm"),
        meeting_type: "regular",
        location: "",
      })
      toast({
        title: "Sitzung erstellt",
        description: "Die Qualitätszirkel-Sitzung wurde geplant.",
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Sitzung konnte nicht erstellt werden.",
        variant: "destructive",
      })
    }
  }

  const createAction = async () => {
    if (!practiceId) {
      toast({
        title: "Fehler",
        description: "Keine Praxis-ID gefunden. Bitte laden Sie die Seite neu.",
        variant: "destructive",
      })
      return
    }

    try {
      await createQualityCircleItem(practiceId, "action", {
        ...newAction,
        status: "open",
        assigned_to: newAction.assigned_to || null,
        due_date: newAction.due_date || null,
      })

      mutate()
      setShowNewActionDialog(false)
      setNewAction({
        title: "",
        description: "",
        assigned_to: "",
        due_date: "",
        priority: "medium",
      })
      toast({
        title: "Maßnahme erstellt",
        description: "Die neue Maßnahme wurde angelegt.",
      })
    }
  }

  const updateActionStatus = async (actionId: string, newStatus: string) => {
    if (!practiceId) return

    const updates: any = { status: newStatus }
    if (newStatus === "completed") {
      updates.completed_at = new Date().toISOString()
    }

    try {
      await updateQualityCircleItem(practiceId, "action", actionId, updates)
      mutateQuality()
    } catch (error) {
      console.error("Error updating action:", error)
    }
  }

  const updateTopicStatus = async (topicId: string, newStatus: string) => {
    if (!practiceId) return

    try {
      await updateQualityCircleItem(practiceId, "topic", topicId, { status: newStatus })
      mutateQuality()
    } catch (error) {
      console.error("Error updating topic:", error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "open":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "cancelled":
        return "bg-gray-100 text-gray-500 dark:bg-gray-900 dark:text-gray-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  const openActions = actions.filter((a) => a.status === "open" || a.status === "in_progress")
  const overdueActions = actions.filter(
    (a) =>
      a.due_date && isBefore(new Date(a.due_date), new Date()) && a.status !== "completed" && a.status !== "cancelled",
  )
  const upcomingSessions = sessions.filter(
    (s) => s.status === "scheduled" && isAfter(new Date(s.scheduled_date), new Date()),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Qualitätszirkel</h1>
          <p className="text-muted-foreground">
            Automatisierte Qualitätszirkel mit KI-gestützten Themenvorschlägen und Benchmarking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateAITopics} disabled={generating}>
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            KI-Themen generieren
          </Button>
          <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Neue Sitzung
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neue Qualitätszirkel-Sitzung</DialogTitle>
                <DialogDescription>Planen Sie eine neue Qualitätszirkel-Sitzung für Ihr Team.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Titel</Label>
                  <Input
                    id="title"
                    value={newSession.title}
                    onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                    placeholder="z.B. Monatlicher Qualitätszirkel"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Beschreibung</Label>
                  <Textarea
                    id="description"
                    value={newSession.description}
                    onChange={(e) => setNewSession({ ...newSession, description: e.target.value })}
                    placeholder="Themen und Ziele der Sitzung..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="scheduled_date">Datum & Uhrzeit</Label>
                  <Input
                    id="scheduled_date"
                    type="datetime-local"
                    value={newSession.scheduled_date}
                    onChange={(e) => setNewSession({ ...newSession, scheduled_date: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="meeting_type">Art der Sitzung</Label>
                  <Select
                    value={newSession.meeting_type}
                    onValueChange={(value) => setNewSession({ ...newSession, meeting_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Reguläre Sitzung</SelectItem>
                      <SelectItem value="emergency">Notfallsitzung</SelectItem>
                      <SelectItem value="follow_up">Nachbesprechung</SelectItem>
                      <SelectItem value="annual_review">Jahresreview</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Ort</Label>
                  <Input
                    id="location"
                    value={newSession.location}
                    onChange={(e) => setNewSession({ ...newSession, location: e.target.value })}
                    placeholder="z.B. Besprechungsraum 1 oder Online"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewSessionDialog(false)}>
                  Abbrechen
                </Button>
                <Button onClick={createSession} disabled={!newSession.title}>
                  Sitzung erstellen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anstehende Sitzungen</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingSessions.length}</div>
            {upcomingSessions[0] && (
              <p className="text-xs text-muted-foreground">
                Nächste: {format(new Date(upcomingSessions[0].scheduled_date), "dd.MM.yyyy", { locale: de })}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offene Themen</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {topics.filter((t) => t.status === "proposed" || t.status === "accepted").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {topics.filter((t) => t.source === "ai_suggested").length} KI-vorgeschlagen
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offene Maßnahmen</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openActions.length}</div>
            <p className="text-xs text-muted-foreground">
              {overdueActions.length > 0 ? (
                <span className="text-red-500">{overdueActions.length} überfällig</span>
              ) : (
                "Keine überfällig"
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Benchmarks</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{benchmarks.length}</div>
            <p className="text-xs text-muted-foreground">
              {benchmarks.filter((b) => b.trend === "improving").length} verbessert
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">
            <Calendar className="mr-2 h-4 w-4" />
            Sitzungen
          </TabsTrigger>
          <TabsTrigger value="topics">
            <MessageSquare className="mr-2 h-4 w-4" />
            Themen
          </TabsTrigger>
          <TabsTrigger value="actions">
            <ClipboardList className="mr-2 h-4 w-4" />
            Maßnahmen
          </TabsTrigger>
          <TabsTrigger value="benchmarks">
            <BarChart3 className="mr-2 h-4 w-4" />
            Benchmarks
          </TabsTrigger>
        </TabsList>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-4">
          {sessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine Sitzungen geplant</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Erstellen Sie Ihre erste Qualitätszirkel-Sitzung, um loszulegen.
                </p>
                <Button onClick={() => setShowNewSessionDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Erste Sitzung planen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sessions.map((session) => (
                <Card key={session.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{session.title}</CardTitle>
                        <CardDescription>
                          {format(new Date(session.scheduled_date), "EEEE, dd. MMMM yyyy 'um' HH:mm 'Uhr'", {
                            locale: de,
                          })}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {session.meeting_type === "regular"
                            ? "Regulär"
                            : session.meeting_type === "emergency"
                              ? "Notfall"
                              : session.meeting_type === "follow_up"
                                ? "Nachbesprechung"
                                : "Jahresreview"}
                        </Badge>
                        <Badge
                          className={
                            session.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : session.status === "in_progress"
                                ? "bg-blue-100 text-blue-800"
                                : session.status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {session.status === "scheduled"
                            ? "Geplant"
                            : session.status === "in_progress"
                              ? "Läuft"
                              : session.status === "completed"
                                ? "Abgeschlossen"
                                : "Abgesagt"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  {session.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{session.description}</p>
                      {session.location && <p className="text-sm text-muted-foreground mt-2">📍 {session.location}</p>}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Topics Tab */}
        <TabsContent value="topics" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Themenvorschläge</h3>
            <Button variant="outline" size="sm" onClick={generateAITopics} disabled={generating}>
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Neue Themen generieren
            </Button>
          </div>

          {topics.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine Themen vorhanden</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Lassen Sie die KI automatisch relevante Themen aus Ihren Praxisdaten generieren.
                </p>
                <Button onClick={generateAITopics} disabled={generating}>
                  {generating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  KI-Themen generieren
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {topics.map((topic) => (
                <Card key={topic.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {topic.source === "ai_suggested" && <Sparkles className="h-4 w-4 text-purple-500" />}
                          <CardTitle className="text-base">{topic.title}</CardTitle>
                        </div>
                        {topic.description && <CardDescription className="mt-1">{topic.description}</CardDescription>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(topic.priority)}>
                          {topic.priority === "critical"
                            ? "Kritisch"
                            : topic.priority === "high"
                              ? "Hoch"
                              : topic.priority === "medium"
                                ? "Mittel"
                                : "Niedrig"}
                        </Badge>
                        <Badge variant="outline">
                          {topic.status === "proposed"
                            ? "Vorgeschlagen"
                            : topic.status === "accepted"
                              ? "Akzeptiert"
                              : topic.status === "discussed"
                                ? "Besprochen"
                                : topic.status === "deferred"
                                  ? "Verschoben"
                                  : "Abgelehnt"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {topic.category && <span>Kategorie: {topic.category}</span>}
                        {topic.relevance_score && <span>Relevanz: {Math.round(topic.relevance_score * 100)}%</span>}
                      </div>
                      {topic.status === "proposed" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => updateTopicStatus(topic.id, "accepted")}>
                            <Check className="h-4 w-4 mr-1" />
                            Akzeptieren
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateTopicStatus(topic.id, "rejected")}>
                            <X className="h-4 w-4 mr-1" />
                            Ablehnen
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Actions Tab */}
        <TabsContent value="actions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Maßnahmen</h3>
            <Dialog open={showNewActionDialog} onOpenChange={setShowNewActionDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Neue Maßnahme
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neue Maßnahme erstellen</DialogTitle>
                  <DialogDescription>Dokumentieren Sie eine neue Maßnahme aus dem Qualitätszirkel.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="action_title">Titel</Label>
                    <Input
                      id="action_title"
                      value={newAction.title}
                      onChange={(e) => setNewAction({ ...newAction, title: e.target.value })}
                      placeholder="z.B. Dokumentationsvorlage aktualisieren"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="action_description">Beschreibung</Label>
                    <Textarea
                      id="action_description"
                      value={newAction.description}
                      onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                      placeholder="Details zur Umsetzung..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="assigned_to">Zugewiesen an</Label>
                    <Select
                      value={newAction.assigned_to}
                      onValueChange={(value) => setNewAction({ ...newAction, assigned_to: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Teammitglied auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.first_name} {member.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="due_date">Fälligkeitsdatum</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={newAction.due_date}
                      onChange={(e) => setNewAction({ ...newAction, due_date: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="priority">Priorität</Label>
                    <Select
                      value={newAction.priority}
                      onValueChange={(value) => setNewAction({ ...newAction, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Kritisch</SelectItem>
                        <SelectItem value="high">Hoch</SelectItem>
                        <SelectItem value="medium">Mittel</SelectItem>
                        <SelectItem value="low">Niedrig</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewActionDialog(false)}>
                    Abbrechen
                  </Button>
                  <Button onClick={createAction} disabled={!newAction.title}>
                    Maßnahme erstellen
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {actions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine Maßnahmen vorhanden</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Erstellen Sie Maßnahmen, um Verbesserungen zu dokumentieren und nachzuverfolgen.
                </p>
                <Button onClick={() => setShowNewActionDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Erste Maßnahme erstellen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {actions.map((action) => (
                <Card key={action.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{action.title}</CardTitle>
                        {action.description && <CardDescription className="mt-1">{action.description}</CardDescription>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(action.priority)}>
                          {action.priority === "critical"
                            ? "Kritisch"
                            : action.priority === "high"
                              ? "Hoch"
                              : action.priority === "medium"
                                ? "Mittel"
                                : "Niedrig"}
                        </Badge>
                        <Badge className={getStatusColor(action.status)}>
                          {action.status === "open"
                            ? "Offen"
                            : action.status === "in_progress"
                              ? "In Bearbeitung"
                              : action.status === "completed"
                                ? "Abgeschlossen"
                                : action.status === "overdue"
                                  ? "Überfällig"
                                  : "Abgebrochen"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {action.due_date && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Fällig: {format(new Date(action.due_date), "dd.MM.yyyy", { locale: de })}
                          </span>
                        )}
                        {action.assignee && (
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {action.assignee.first_name} {action.assignee.last_name}
                          </span>
                        )}
                      </div>
                      {action.status !== "completed" && action.status !== "cancelled" && (
                        <div className="flex gap-2">
                          {action.status === "open" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateActionStatus(action.id, "in_progress")}
                            >
                              Starten
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateActionStatus(action.id, "completed")}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Abschließen
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Benchmarks Tab */}
        <TabsContent value="benchmarks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Branchenbenchmarks</h3>
          </div>

          {benchmarks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine Benchmarks verfügbar</h3>
                <p className="text-muted-foreground text-center">
                  Benchmark-Daten werden automatisch aus Branchendaten generiert.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {benchmarks.map((benchmark) => (
                <Card key={benchmark.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {benchmark.category}
                        </Badge>
                        <CardTitle className="text-base">{benchmark.metric_name}</CardTitle>
                        {benchmark.metric_description && (
                          <CardDescription className="mt-1">{benchmark.metric_description}</CardDescription>
                        )}
                      </div>
                      {getTrendIcon(benchmark.trend)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {benchmark.practice_score !== undefined && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Ihr Wert</span>
                            <span className="font-medium">
                              {benchmark.practice_score} {benchmark.unit}
                            </span>
                          </div>
                          <Progress
                            value={
                              ((benchmark.practice_score - benchmark.industry_min) /
                                (benchmark.industry_max - benchmark.industry_min)) *
                              100
                            }
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="text-center p-2 bg-muted rounded">
                          <div className="text-muted-foreground">Min</div>
                          <div className="font-medium">
                            {benchmark.industry_min} {benchmark.unit}
                          </div>
                        </div>
                        <div className="text-center p-2 bg-muted rounded">
                          <div className="text-muted-foreground">Durchschnitt</div>
                          <div className="font-medium">
                            {benchmark.industry_avg} {benchmark.unit}
                          </div>
                        </div>
                        <div className="text-center p-2 bg-muted rounded">
                          <div className="text-muted-foreground">Top 25%</div>
                          <div className="font-medium">
                            {benchmark.top_quartile} {benchmark.unit}
                          </div>
                        </div>
                      </div>
                      {benchmark.percentile !== undefined && (
                        <p className="text-sm text-muted-foreground text-center">
                          Sie sind besser als {benchmark.percentile}% der Praxen
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
