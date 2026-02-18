"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { CalendarDays, Loader2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { usePractice } from "@/contexts/practice-context"

interface DienstplanSettings {
  plannerDays: 5 | 6 | 7
}

const DEFAULT_SETTINGS: DienstplanSettings = {
  plannerDays: 5,
}

export function DienstplanSettingsTab() {
  const { toast } = useToast()
  const { currentPractice } = usePractice()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<DienstplanSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    const loadSettings = async () => {
      if (!currentPractice?.id) return
      setLoading(true)
      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/settings`)
        if (response.ok) {
          const data = await response.json()
          const systemSettings = data?.settings?.system_settings
          if (systemSettings?.dienstplan) {
            setSettings({
              plannerDays: systemSettings.dienstplan.plannerDays || 5,
            })
          }
        }
      } catch (error) {
        console.error("Error loading dienstplan settings:", error)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [currentPractice?.id])

  const handleSave = async () => {
    if (!currentPractice?.id) return
    setSaving(true)
    try {
      // First load existing system_settings to merge
      const getResponse = await fetch(`/api/practices/${currentPractice.id}/settings`)
      let existingSystemSettings = {}
      if (getResponse.ok) {
        const data = await getResponse.json()
        existingSystemSettings = data?.settings?.system_settings || {}
      }

      const response = await fetch(`/api/practices/${currentPractice.id}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_settings: {
            ...existingSystemSettings,
            dienstplan: settings,
          },
        }),
      })

      if (response.ok) {
        toast({
          title: "Gespeichert",
          description: "Dienstplan-Einstellungen wurden erfolgreich gespeichert",
        })
      } else {
        throw new Error("Save failed")
      }
    } catch (error) {
      console.error("Error saving dienstplan settings:", error)
      toast({
        title: "Fehler",
        description: "Dienstplan-Einstellungen konnten nicht gespeichert werden",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Dienstplan-Einstellungen
          </CardTitle>
          <CardDescription>
            Konfigurieren Sie die Grundeinstellungen fur Ihren Dienstplan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Planner Days */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Arbeitstage im Planer</Label>
            <p className="text-sm text-muted-foreground">
              Legen Sie fest, wie viele Tage pro Woche im Dienstplan angezeigt werden sollen.
            </p>
            <RadioGroup
              value={String(settings.plannerDays)}
              onValueChange={(val) =>
                setSettings((prev) => ({ ...prev, plannerDays: Number(val) as 5 | 6 | 7 }))
              }
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              <Label
                htmlFor="days-5"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  settings.plannerDays === 5
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="5" id="days-5" className="sr-only" />
                <span className="text-2xl font-bold">5</span>
                <span className="text-sm font-medium">Tage</span>
                <span className="text-xs text-muted-foreground text-center">Mo - Fr</span>
              </Label>
              <Label
                htmlFor="days-6"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  settings.plannerDays === 6
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="6" id="days-6" className="sr-only" />
                <span className="text-2xl font-bold">6</span>
                <span className="text-sm font-medium">Tage</span>
                <span className="text-xs text-muted-foreground text-center">Mo - Sa</span>
              </Label>
              <Label
                htmlFor="days-7"
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  settings.plannerDays === 7
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value="7" id="days-7" className="sr-only" />
                <span className="text-2xl font-bold">7</span>
                <span className="text-sm font-medium">Tage</span>
                <span className="text-xs text-muted-foreground text-center">Mo - So</span>
              </Label>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Einstellungen speichern
      </Button>
    </div>
  )
}
