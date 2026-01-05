"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/hooks/use-toast"
import {
  Mail,
  Clock,
  Users,
  FileText,
  Target,
  Workflow,
  Package,
  Wrench,
  DollarSign,
  Sparkles,
  Send,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  History,
  Settings,
  Eye,
  Plus,
  Trash2,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  ListTodo,
  CalendarDays,
} from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"

interface WeeklySummarySettings {
  id?: string
  is_enabled: boolean
  send_day: number
  send_time: string
  timezone: string
  recipients: Array<{ email: string; name: string; role: string }>
  send_to_admins: boolean
  send_to_managers: boolean
  include_todos: boolean
  include_appointments: boolean
  include_team_updates: boolean
  include_documents: boolean
  include_goals: boolean
  include_workflows: boolean
  include_inventory_alerts: boolean
  include_device_maintenance: boolean
  include_financial_summary: boolean
  include_ai_insights: boolean
  custom_intro: string
  custom_footer: string
  branding_color: string
  include_logo: boolean
  last_sent_at?: string
  last_sent_status?: string
  send_count?: number
}

interface SummaryHistory {
  id: string
  sent_at: string
  recipients_count: number
  status: string
  error_message?: string
  todos_count: number
  appointments_count: number
  open_tasks: number
  completed_tasks: number
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sonntag" },
  { value: 1, label: "Montag" },
  { value: 2, label: "Dienstag" },
  { value: 3, label: "Mittwoch" },
  { value: 4, label: "Donnerstag" },
  { value: 5, label: "Freitag" },
  { value: 6, label: "Samstag" },
]

const CONTENT_SECTIONS = [
  {
    key: "include_todos",
    label: "Aufgaben & To-Dos",
    icon: ListTodo,
    description: "Offene und abgeschlossene Aufgaben",
  },
  { key: "include_appointments", label: "Termine", icon: CalendarDays, description: "Bevorstehende Termine der Woche" },
  { key: "include_team_updates", label: "Team-Updates", icon: Users, description: "Neue Mitarbeiter, Abwesenheiten" },
  { key: "include_documents", label: "Dokumente", icon: FileText, description: "Neue und geänderte Dokumente" },
  { key: "include_goals", label: "Ziele & Meilensteine", icon: Target, description: "Fortschritt bei Praxiszielen" },
  { key: "include_workflows", label: "Workflows", icon: Workflow, description: "Status laufender Prozesse" },
  {
    key: "include_inventory_alerts",
    label: "Inventar-Warnungen",
    icon: Package,
    description: "Niedrige Bestände, Ablaufdaten",
  },
  { key: "include_device_maintenance", label: "Geräte-Wartung", icon: Wrench, description: "Anstehende Wartungen" },
  {
    key: "include_financial_summary",
    label: "Finanz-Übersicht",
    icon: DollarSign,
    description: "Umsatz und Abrechnungen",
  },
  {
    key: "include_ai_insights",
    label: "KI-Empfehlungen",
    icon: Sparkles,
    description: "Automatische Verbesserungsvorschläge",
  },
]

interface WeeklySummarySettingsProps {
  practiceId: string | number
}

export default function WeeklySummarySettings({ practiceId }: WeeklySummarySettingsProps) {
  const [settings, setSettings] = useState<WeeklySummarySettings>({
    is_enabled: false,
    send_day: 1,
    send_time: "08:00",
    timezone: "Europe/Berlin",
    recipients: [],
    send_to_admins: true,
    send_to_managers: false,
    include_todos: true,
    include_appointments: true,
    include_team_updates: true,
    include_documents: true,
    include_goals: true,
    include_workflows: true,
    include_inventory_alerts: true,
    include_device_maintenance: true,
    include_financial_summary: false,
    include_ai_insights: true,
    custom_intro: "",
    custom_footer: "",
    branding_color: "#3b82f6",
    include_logo: true,
  })

  const [history, setHistory] = useState<SummaryHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [newRecipient, setNewRecipient] = useState({ email: "", name: "", role: "admin" })
  const [activeTab, setActiveTab] = useState("settings")

  useEffect(() => {
    loadSettings()
    loadHistory()
  }, [practiceId])

  const loadSettings = async () => {
    try {
      const response = await fetch(`/api/practices/${practiceId}/weekly-summary/settings`)
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setSettings(data.settings)
        }
      }
    } catch (error) {
      console.error("Error loading weekly summary settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadHistory = async () => {
    try {
      const response = await fetch(`/api/practices/${practiceId}/weekly-summary/history`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
      }
    } catch (error) {
      console.error("Error loading history:", error)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/weekly-summary/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (!response.ok) throw new Error("Failed to save")

      toast({
        title: "Einstellungen gespeichert",
        description: "Die wöchentlichen Zusammenfassungs-Einstellungen wurden aktualisiert.",
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const sendTestEmail = async () => {
    setSending(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/weekly-summary/send-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Failed to send")

      toast({
        title: "Test-E-Mail gesendet",
        description: "Die Vorschau wurde an die konfigurierten Empfänger gesendet.",
      })

      loadHistory()
    } catch (error: any) {
      toast({
        title: "Fehler beim Senden",
        description: error.message || "Die Test-E-Mail konnte nicht gesendet werden.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  const addRecipient = () => {
    if (!newRecipient.email) return

    setSettings((prev) => ({
      ...prev,
      recipients: [...prev.recipients, { ...newRecipient }],
    }))
    setNewRecipient({ email: "", name: "", role: "admin" })
  }

  const removeRecipient = (index: number) => {
    setSettings((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index),
    }))
  }

  const updateSetting = (key: keyof WeeklySummarySettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Wöchentliche Zusammenfassung
          </h3>
          <p className="text-sm text-muted-foreground">
            Erhalten Sie jeden Montag eine professionelle Übersicht aller wichtigen Praxis-Aktivitäten
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={settings.is_enabled} onCheckedChange={(checked) => updateSetting("is_enabled", checked)} />
          <Label>{settings.is_enabled ? "Aktiv" : "Inaktiv"}</Label>
        </div>
      </div>

      {/* Status Alert */}
      {settings.last_sent_at && (
        <Alert variant={settings.last_sent_status === "sent" ? "default" : "destructive"}>
          <div className="flex items-center gap-2">
            {settings.last_sent_status === "sent" ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              Letzte Zusammenfassung:{" "}
              {format(new Date(settings.last_sent_at), "dd.MM.yyyy 'um' HH:mm 'Uhr'", { locale: de })}
              {settings.send_count && ` (${settings.send_count} insgesamt gesendet)`}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="settings" className="flex-1 gap-2">
            <Settings className="h-4 w-4" />
            Einstellungen
          </TabsTrigger>
          <TabsTrigger value="content" className="flex-1 gap-2">
            <FileText className="h-4 w-4" />
            Inhalte
          </TabsTrigger>
          <TabsTrigger value="recipients" className="flex-1 gap-2">
            <Users className="h-4 w-4" />
            Empfänger
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex-1 gap-2">
            <Eye className="h-4 w-4" />
            Vorschau
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 gap-2">
            <History className="h-4 w-4" />
            Verlauf
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Versandzeitpunkt
              </CardTitle>
              <CardDescription>Wann soll die wöchentliche Zusammenfassung gesendet werden?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Wochentag</Label>
                  <Select
                    value={settings.send_day.toString()}
                    onValueChange={(v) => updateSetting("send_day", Number.parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Uhrzeit</Label>
                  <Input
                    type="time"
                    value={settings.send_time}
                    onChange={(e) => updateSetting("send_time", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Zeitzone</Label>
                  <Select value={settings.timezone} onValueChange={(v) => updateSetting("timezone", v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Berlin">Europe/Berlin (MEZ)</SelectItem>
                      <SelectItem value="Europe/Vienna">Europe/Vienna (MEZ)</SelectItem>
                      <SelectItem value="Europe/Zurich">Europe/Zurich (MEZ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Anpassung
              </CardTitle>
              <CardDescription>Personalisieren Sie Ihre Zusammenfassung</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Einleitungstext (optional)</Label>
                <Textarea
                  placeholder="z.B. Hier ist Ihre wöchentliche Praxis-Übersicht..."
                  value={settings.custom_intro}
                  onChange={(e) => updateSetting("custom_intro", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Abschlusstext (optional)</Label>
                <Textarea
                  placeholder="z.B. Bei Fragen wenden Sie sich an..."
                  value={settings.custom_footer}
                  onChange={(e) => updateSetting("custom_footer", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <Label>Markenfarbe</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={settings.branding_color}
                      onChange={(e) => updateSetting("branding_color", e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.branding_color}
                      onChange={(e) => updateSetting("branding_color", e.target.value)}
                      className="w-28"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={settings.include_logo}
                    onCheckedChange={(checked) => updateSetting("include_logo", checked)}
                  />
                  <Label>Praxis-Logo einbinden</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Enthaltene Bereiche</CardTitle>
              <CardDescription>
                Wählen Sie, welche Informationen in der Zusammenfassung enthalten sein sollen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {CONTENT_SECTIONS.map((section) => {
                  const Icon = section.icon
                  const isEnabled = settings[section.key as keyof WeeklySummarySettings] as boolean

                  return (
                    <div
                      key={section.key}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                        isEnabled ? "border-primary/50 bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{section.label}</p>
                          <p className="text-xs text-muted-foreground">{section.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) =>
                          updateSetting(section.key as keyof WeeklySummarySettings, checked)
                        }
                      />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recipients Tab */}
        <TabsContent value="recipients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Automatische Empfänger</CardTitle>
              <CardDescription>Basierend auf Benutzerrollen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Praxis-Administratoren</p>
                    <p className="text-sm text-muted-foreground">Alle Benutzer mit Admin-Rolle</p>
                  </div>
                </div>
                <Switch
                  checked={settings.send_to_admins}
                  onCheckedChange={(checked) => updateSetting("send_to_admins", checked)}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Manager</p>
                    <p className="text-sm text-muted-foreground">Benutzer mit Manager-Rechten</p>
                  </div>
                </div>
                <Switch
                  checked={settings.send_to_managers}
                  onCheckedChange={(checked) => updateSetting("send_to_managers", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Zusätzliche Empfänger</CardTitle>
              <CardDescription>Manuelle E-Mail-Adressen hinzufügen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="E-Mail-Adresse"
                  type="email"
                  value={newRecipient.email}
                  onChange={(e) => setNewRecipient((prev) => ({ ...prev, email: e.target.value }))}
                  className="flex-1"
                />
                <Input
                  placeholder="Name (optional)"
                  value={newRecipient.name}
                  onChange={(e) => setNewRecipient((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-40"
                />
                <Button onClick={addRecipient} disabled={!newRecipient.email}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {settings.recipients.length > 0 ? (
                <div className="space-y-2">
                  {settings.recipients.map((recipient, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{recipient.email}</p>
                          {recipient.name && <p className="text-xs text-muted-foreground">{recipient.name}</p>}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeRecipient(index)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Keine zusätzlichen Empfänger konfiguriert
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                E-Mail-Vorschau
              </CardTitle>
              <CardDescription>So wird Ihre wöchentliche Zusammenfassung aussehen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                {/* Email Preview */}
                <div className="bg-muted p-4 border-b">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Von:</span>
                    <span className="text-muted-foreground">noreply@effizienz-praxis.de</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">Betreff:</span>
                    <span>Wöchentliche Praxis-Zusammenfassung - KW {format(new Date(), "w", { locale: de })}</span>
                  </div>
                </div>

                <div className="p-6 bg-white">
                  {/* Header */}
                  <div
                    className="p-6 rounded-t-lg text-white mb-6"
                    style={{ backgroundColor: settings.branding_color }}
                  >
                    <h1 className="text-2xl font-bold">Wöchentliche Zusammenfassung</h1>
                    <p className="opacity-90">
                      Kalenderwoche {format(new Date(), "w", { locale: de })} -{" "}
                      {format(new Date(), "MMMM yyyy", { locale: de })}
                    </p>
                  </div>

                  {settings.custom_intro && <p className="text-muted-foreground mb-6">{settings.custom_intro}</p>}

                  {/* Quick Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <BarChart3 className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">12</p>
                      <p className="text-xs text-muted-foreground">Aufgaben erledigt</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <CalendarDays className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                      <p className="text-2xl font-bold">28</p>
                      <p className="text-xs text-muted-foreground">Termine</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
                      <p className="text-2xl font-bold">85%</p>
                      <p className="text-xs text-muted-foreground">Ziel-Fortschritt</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                      <p className="text-2xl font-bold">3</p>
                      <p className="text-xs text-muted-foreground">Warnungen</p>
                    </div>
                  </div>

                  {/* Content Sections Preview */}
                  <div className="space-y-4">
                    {settings.include_todos && (
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold flex items-center gap-2 mb-2">
                          <ListTodo className="h-4 w-4" />
                          Aufgaben-Übersicht
                        </h3>
                        <p className="text-sm text-muted-foreground">5 offene Aufgaben, 12 diese Woche erledigt</p>
                      </div>
                    )}
                    {settings.include_appointments && (
                      <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold flex items-center gap-2 mb-2">
                          <CalendarDays className="h-4 w-4" />
                          Kommende Termine
                        </h3>
                        <p className="text-sm text-muted-foreground">28 Termine in der nächsten Woche geplant</p>
                      </div>
                    )}
                    {settings.include_ai_insights && (
                      <div className="p-4 border rounded-lg bg-primary/5">
                        <h3 className="font-semibold flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          KI-Empfehlung
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Basierend auf den Daten empfehlen wir, die Terminplanung am Mittwoch zu optimieren...
                        </p>
                      </div>
                    )}
                  </div>

                  {settings.custom_footer && (
                    <p className="text-sm text-muted-foreground mt-6 pt-6 border-t">{settings.custom_footer}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Versandverlauf
              </CardTitle>
              <CardDescription>Übersicht der gesendeten Zusammenfassungen</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {history.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-4">
                          {entry.status === "sent" ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-destructive" />
                          )}
                          <div>
                            <p className="font-medium">
                              {format(new Date(entry.sent_at), "dd.MM.yyyy 'um' HH:mm 'Uhr'", { locale: de })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {entry.recipients_count} Empfänger • {entry.todos_count} Aufgaben •{" "}
                              {entry.appointments_count} Termine
                            </p>
                          </div>
                        </div>
                        <Badge variant={entry.status === "sent" ? "default" : "destructive"}>
                          {entry.status === "sent" ? "Gesendet" : "Fehlgeschlagen"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12">
                  <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Noch keine Zusammenfassungen gesendet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button variant="outline" onClick={sendTestEmail} disabled={sending}>
          {sending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wird gesendet...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Test-E-Mail senden
            </>
          )}
        </Button>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Speichert...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Einstellungen speichern
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
