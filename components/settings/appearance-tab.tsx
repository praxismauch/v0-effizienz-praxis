"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Palette, Moon, Sun, Languages, Save, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"
import { useUser } from "@/contexts/user-context"

interface AppearanceSettings {
  darkMode: boolean
  language: string
  compactMode: boolean
}

export function AppearanceTab() {
  const { toast } = useToast()
  const { currentPractice } = usePractice()
  const { currentUser } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<AppearanceSettings>({
    darkMode: false,
    language: "de",
    compactMode: false,
  })

  useEffect(() => {
    // Load settings from localStorage or user preferences
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem("appearance-settings")
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings))
        }
        // Check system dark mode preference
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        if (!savedSettings) {
          setSettings(prev => ({ ...prev, darkMode: prefersDark }))
        }
      } catch (error) {
        console.error("Error loading appearance settings:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  // Apply dark mode
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [settings.darkMode])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      localStorage.setItem("appearance-settings", JSON.stringify(settings))
      toast({
        title: "Einstellungen gespeichert",
        description: "Ihre Anzeigeeinstellungen wurden gespeichert.",
      })
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Darstellung
          </CardTitle>
          <CardDescription>Passen Sie das Erscheinungsbild der Anwendung an</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                {settings.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                Dunkelmodus
              </Label>
              <p className="text-sm text-muted-foreground">Wechseln Sie zum dunklen Farbschema</p>
            </div>
            <Switch
              checked={settings.darkMode}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, darkMode: checked }))}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Kompaktansicht</Label>
              <p className="text-sm text-muted-foreground">Reduzieren Sie Abstände für mehr Inhalte</p>
            </div>
            <Switch
              checked={settings.compactMode}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, compactMode: checked }))}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Sprache
            </Label>
            <Select
              value={settings.language}
              onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label className="text-muted-foreground">Datums- und Zeitformat</Label>
            <p className="text-sm text-muted-foreground">
              Das System verwendet das deutsche Format: DD.MM.YYYY und HH:mm (24-Stunden)
            </p>
          </div>
          <div className="pt-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Einstellungen speichern
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AppearanceTab
