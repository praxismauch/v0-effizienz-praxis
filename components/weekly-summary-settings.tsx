"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
import { Mail, Users, FileText, Send, Save, Loader2, CheckCircle, XCircle, History, Settings, Eye } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import type { WeeklySummarySettings as SettingsType, SummaryHistory } from "./weekly-summary/types"
import { DEFAULT_SETTINGS } from "./weekly-summary/types"
import { ScheduleSettingsTab } from "./weekly-summary/schedule-settings-tab"
import { ContentTab } from "./weekly-summary/content-tab"
import { RecipientsTab } from "./weekly-summary/recipients-tab"
import { PreviewTab } from "./weekly-summary/preview-tab"
import { HistoryTab } from "./weekly-summary/history-tab"

interface WeeklySummarySettingsProps {
  practiceId: string | number
}

export default function WeeklySummarySettings({ practiceId }: WeeklySummarySettingsProps) {
  const [settings, setSettings] = useState<SettingsType>(DEFAULT_SETTINGS)
  const [history, setHistory] = useState<SummaryHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
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
        if (data.settings) setSettings(data.settings)
      }
    } catch {
      // silently handle
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
    } catch {
      // silently handle
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
      toast({ title: "Einstellungen gespeichert", description: "Die wöchentlichen Zusammenfassungs-Einstellungen wurden aktualisiert." })
    } catch {
      toast({ title: "Fehler", description: "Die Einstellungen konnten nicht gespeichert werden.", variant: "destructive" })
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
      toast({ title: "Test-E-Mail gesendet", description: "Die Vorschau wurde an die konfigurierten Empfänger gesendet." })
      loadHistory()
    } catch (error: any) {
      toast({ title: "Fehler beim Senden", description: error.message || "Die Test-E-Mail konnte nicht gesendet werden.", variant: "destructive" })
    } finally {
      setSending(false)
    }
  }

  const updateSetting = (key: keyof SettingsType, value: any) => {
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

        <TabsContent value="settings">
          <ScheduleSettingsTab settings={settings} onUpdate={updateSetting} />
        </TabsContent>
        <TabsContent value="content">
          <ContentTab settings={settings} onUpdate={updateSetting} />
        </TabsContent>
        <TabsContent value="recipients">
          <RecipientsTab
            settings={settings}
            onUpdate={updateSetting}
            onRecipientsChange={(recipients) => setSettings((prev) => ({ ...prev, recipients }))}
          />
        </TabsContent>
        <TabsContent value="preview">
          <PreviewTab settings={settings} />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab history={history} />
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
