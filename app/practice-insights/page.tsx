"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { format, parseISO } from "date-fns"
import { de } from "date-fns/locale"
import {
  BookOpen,
  Plus,
  Settings,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  Target,
  Sparkles,
  Eye,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { JournalPreferencesDialog } from "@/components/insights/insights-preferences-dialog"
import { GenerateJournalDialog } from "@/components/insights/generate-insights-dialog"
import { ViewJournalDialog } from "@/components/insights/view-insights-dialog"
import { useUser } from "@/contexts/user-context"
import { usePractice } from "@/contexts/practice-context"
import { AppLayout } from "@/components/app-layout"

interface Journal {
  id: string
  practice_id: string
  period_type: "weekly" | "monthly" | "quarterly" | "yearly"
  period_start: string
  period_end: string
  title: string
  summary: string | null
  ai_analysis: any
  kpis_included: any
  diagrams: any
  user_notes: string | null
  status: "draft" | "published" | "archived"
  generated_by: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

interface JournalPreferences {
  id: string
  practice_id: string
  enabled: boolean
  frequency: "weekly" | "monthly" | "quarterly" | "yearly"
  auto_generate: boolean
  remind_admin: boolean
  reminder_days_before: number
  include_kpis: boolean
  include_team_data: boolean
  include_financial_data: boolean
  include_patient_data: boolean
  generate_action_plan: boolean
  last_reminder_sent: string | null
  next_journal_due: string | null
}

interface ActionItem {
  id: string
  journal_id: string
  title: string
  description: string | null
  priority: "low" | "medium" | "high" | "urgent"
  category: string | null
  assigned_to: string | null
  due_date: string | null
  status: "pending" | "in_progress" | "completed" | "cancelled"
  ai_generated: boolean
}

export default function PracticeJournalsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [journals, setJournals] = useState<Journal[]>([])
  const [preferences, setPreferences] = useState<JournalPreferences | null>(null)
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [kpiCount, setKpiCount] = useState(0)
  const [showPreferencesDialog, setShowPreferencesDialog] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const { currentUser: authUser, loading: authLoading } = useUser()
  const { currentPractice, isLoading: practiceLoading } = usePractice()

  useEffect(() => {
    if (authLoading || practiceLoading) {
      return
    }

    if (!authUser) {
      return
    }

    if (!currentPractice?.id) {
      setLoading(false)
      return
    }

    loadData()
  }, [authUser, authLoading, currentPractice, practiceLoading])

  async function loadData() {
    if (!authUser || !currentPractice?.id) return

    try {
      const supabase = createClient()
      const practiceId = currentPractice.id

      setUser({ ...authUser, practice_id: practiceId })

      const { data: journalsData } = await supabase
        .from("practice_journals")
        .select("*")
        .eq("practice_id", practiceId)
        .is("deleted_at", null)
        .order("period_start", { ascending: false })

      setJournals(journalsData || [])

      const { data: prefsData } = await supabase
        .from("journal_preferences")
        .select("*")
        .eq("practice_id", practiceId)
        .is("deleted_at", null)
        .maybeSingle()

      setPreferences(prefsData)

      if (journalsData && journalsData.length > 0) {
        const { data: actionsData } = await supabase
          .from("journal_action_items")
          .select("*")
          .eq("journal_id", journalsData[0].id)
          .is("deleted_at", null)
          .order("priority", { ascending: false })

        setActionItems(actionsData || [])
      }

      const { count } = await supabase
        .from("analytics_parameters")
        .select("*", { count: "exact", head: true })
        .eq("practice_id", practiceId)
        .is("deleted_at", null)

      setKpiCount(count || 0)

      setLoading(false)
    } catch (error) {
      console.error("Error loading data:", error)
      setLoading(false)
    }
  }

  const getPeriodTypeLabel = (type: string) => {
    switch (type) {
      case "weekly":
        return "Wöchentlich"
      case "monthly":
        return "Monatlich"
      case "quarterly":
        return "Quartalsweise"
      case "yearly":
        return "Jährlich"
      default:
        return type
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Entwurf</Badge>
      case "published":
        return <Badge className="bg-green-500">Veröffentlicht</Badge>
      case "archived":
        return <Badge variant="outline">Archiviert</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-500 bg-red-500/10"
      case "high":
        return "text-orange-500 bg-orange-500/10"
      case "medium":
        return "text-yellow-500 bg-yellow-500/10"
      case "low":
        return "text-green-500 bg-green-500/10"
      default:
        return "text-gray-500 bg-gray-500/10"
    }
  }

  const handleJournalGenerated = () => {
    loadData()
    setShowGenerateDialog(false)
  }

  const handlePreferencesSaved = () => {
    loadData()
    setShowPreferencesDialog(false)
  }

  const viewJournal = (journal: Journal) => {
    setSelectedJournal(journal)
    setShowViewDialog(true)
  }

  if (authLoading || practiceLoading) {
    return <AppLayout loading={true} loadingMessage="Praxis-Journal wird geladen..." />
  }

  if (!authUser) {
    return null
  }

  if (!currentPractice?.id) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Keine Praxis ausgewählt</h2>
          <p className="text-muted-foreground">Bitte wählen Sie eine Praxis aus, um die Journals anzuzeigen.</p>
        </div>
      </AppLayout>
    )
  }

  const pendingActions = actionItems.filter((a) => a.status === "pending" || a.status === "in_progress")
  const completedActions = actionItems.filter((a) => a.status === "completed")

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              Praxis-Journal
            </h1>
            <p className="text-muted-foreground">
              KI-generierte Berichte über Ihre Praxisentwicklung mit Aktionsplänen
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowPreferencesDialog(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Einstellungen
            </Button>
            <Button onClick={() => setShowGenerateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Neues Journal
            </Button>
          </div>
        </div>

        {kpiCount === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Tipp:</strong> Für aussagekräftigere Journals mit detaillierten KPI-Analysen empfehlen wir, zuerst
              Kennzahlen in der{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/analytics")}>
                Auswertung
              </Button>{" "}
              zu definieren. Sie können aber auch ohne KPIs Journals erstellen.
            </AlertDescription>
          </Alert>
        )}

        {preferences && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Journal-Einstellungen</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowPreferencesDialog(true)}>
                  Bearbeiten
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Häufigkeit</p>
                  <p className="font-medium">{getPeriodTypeLabel(preferences.frequency)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Nächstes Journal fällig</p>
                  <p className="font-medium">
                    {preferences.next_journal_due
                      ? format(parseISO(preferences.next_journal_due), "dd.MM.yyyy", { locale: de })
                      : "Nicht festgelegt"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Erinnerung</p>
                  <p className="font-medium">
                    {preferences.remind_admin ? `${preferences.reminder_days_before} Tage vorher` : "Deaktiviert"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Aktionsplan</p>
                  <p className="font-medium">
                    {preferences.generate_action_plan ? "Automatisch erstellen" : "Deaktiviert"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="journals" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="journals">
              <FileText className="h-4 w-4 mr-2" />
              Journals ({journals.length})
            </TabsTrigger>
            <TabsTrigger value="actions">
              <Target className="h-4 w-4 mr-2" />
              Handlungsempfehlungen ({pendingActions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="journals" className="space-y-4">
            {journals.length === 0 ? (
              <Card className="p-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Noch keine Journals erstellt</h3>
                <p className="text-muted-foreground mb-4">
                  Erstellen Sie Ihr erstes Praxis-Journal, um Ihre Entwicklung zu dokumentieren.
                </p>
                <Button onClick={() => setShowGenerateDialog(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Erstes Journal erstellen
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4">
                {journals.map((journal) => (
                  <Card key={journal.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{journal.title}</h3>
                            {getStatusBadge(journal.status)}
                            <Badge variant="outline">{getPeriodTypeLabel(journal.period_type)}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Zeitraum: {format(parseISO(journal.period_start), "dd.MM.yyyy", { locale: de })} -{" "}
                            {format(parseISO(journal.period_end), "dd.MM.yyyy", { locale: de })}
                          </p>
                          {journal.summary && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{journal.summary}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Erstellt: {format(parseISO(journal.created_at), "dd.MM.yyyy", { locale: de })}
                            </span>
                            {journal.published_at && (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Veröffentlicht: {format(parseISO(journal.published_at), "dd.MM.yyyy", { locale: de })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => viewJournal(journal)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            {actionItems.length === 0 ? (
              <Card className="p-12 text-center">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine Handlungsempfehlungen vorhanden</h3>
                <p className="text-muted-foreground">
                  Generieren Sie ein Journal, um KI-basierte Handlungsempfehlungen zu erhalten.
                </p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingActions.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      Offene Handlungsempfehlungen ({pendingActions.length})
                    </h3>
                    {pendingActions.map((action) => (
                      <Card key={action.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(action.priority)}`}
                                >
                                  {action.priority === "urgent"
                                    ? "Dringend"
                                    : action.priority === "high"
                                      ? "Hoch"
                                      : action.priority === "medium"
                                        ? "Mittel"
                                        : "Niedrig"}
                                </span>
                                {action.ai_generated && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    KI-generiert
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-medium">{action.title}</h4>
                              {action.description && (
                                <p className="text-sm text-muted-foreground">{action.description}</p>
                              )}
                              {action.due_date && (
                                <p className="text-xs text-muted-foreground">
                                  Fällig: {format(parseISO(action.due_date), "dd.MM.yyyy", { locale: de })}
                                </p>
                              )}
                            </div>
                            <Button variant="outline" size="sm">
                              Als erledigt markieren
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {completedActions.length > 0 && (
                  <div className="space-y-2 mt-6">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                      Erledigte Handlungsempfehlungen ({completedActions.length})
                    </h3>
                    {completedActions.map((action) => (
                      <Card key={action.id} className="opacity-60">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="line-through">{action.title}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <JournalPreferencesDialog
          open={showPreferencesDialog}
          onOpenChange={setShowPreferencesDialog}
          preferences={preferences}
          practiceId={currentPractice?.id}
          onSaved={handlePreferencesSaved}
        />

        <GenerateJournalDialog
          open={showGenerateDialog}
          onOpenChange={setShowGenerateDialog}
          practiceId={currentPractice?.id}
          kpiCount={kpiCount}
          onGenerated={handleJournalGenerated}
        />

        {selectedJournal && (
          <ViewJournalDialog open={showViewDialog} onOpenChange={setShowViewDialog} journal={selectedJournal} />
        )}
      </div>
    </AppLayout>
  )
}
