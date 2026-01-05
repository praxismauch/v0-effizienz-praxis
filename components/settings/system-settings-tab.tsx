"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"
import { Loader2, Save, Settings, Moon, Sun, Languages, Bell } from "lucide-react"

interface SystemSettings {
  theme: "light" | "dark" | "system"
  language: string
  notifications_enabled: boolean
  email_notifications: boolean
  sound_enabled: boolean
}

export function SystemSettingsTab() {
  const { toast } = useToast()
  const { currentPractice } = usePractice()
  const { currentUser } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<SystemSettings>({
    theme: "system",
    language: "de",
    notifications_enabled: true,
    email_notifications: true,
    sound_enabled: false,
  })

  useEffect(() => {
    loadSettings()
  }, [currentUser?.id])

  const loadSettings = async () => {
    if (!currentUser?.id) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${currentUser.id}/preferences`)
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setSettings((prev) => ({ ...prev, ...data.settings }))
        }
      }
    } catch (error) {
      console.error("Error loading system settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!currentUser?.id) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/users/${currentUser.id}/preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })

      if (!response.ok) throw new Error("Failed to save settings")

      toast({
        title: "Gespeichert",
        description: "Die Systemeinstellungen wurden erfolgreich gespeichert.",
      })
    } catch (error) {
      console.error("Error saving system settings:", error)
      toast({
        title: "Fehler",
        description: "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Erscheinungsbild
          </CardTitle>
          <CardDescription>Passen Sie das Erscheinungsbild der Anwendung an</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                {settings.theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                Design
              </Label>
              <p className="text-sm text-muted-foreground">Wählen Sie zwischen hellem und dunklem Design</p>
            </div>
            <Select
              value={settings.theme}
              onValueChange={(value: "light" | "dark" | "system") => setSettings({ ...settings, theme: value })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Hell</SelectItem>
                <SelectItem value="dark">Dunkel</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                Sprache
              </Label>
              <p className="text-sm text-muted-foreground">Sprache der Benutzeroberfläche</p>
            </div>
            <Select value={settings.language} onValueChange={(value) => setSettings({ ...settings, language: value })}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Benachrichtigungen
          </CardTitle>
          <CardDescription>Verwalten Sie Ihre Benachrichtigungseinstellungen</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push-Benachrichtigungen</Label>
              <p className="text-sm text-muted-foreground">Erhalten Sie Benachrichtigungen im Browser</p>
            </div>
            <Switch
              checked={settings.notifications_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, notifications_enabled: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>E-Mail-Benachrichtigungen</Label>
              <p className="text-sm text-muted-foreground">Erhalten Sie wichtige Updates per E-Mail</p>
            </div>
            <Switch
              checked={settings.email_notifications}
              onCheckedChange={(checked) => setSettings({ ...settings, email_notifications: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Ton aktivieren</Label>
              <p className="text-sm text-muted-foreground">Akustische Benachrichtigungen abspielen</p>
            </div>
            <Switch
              checked={settings.sound_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, sound_enabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Speichern...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Einstellungen speichern
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
