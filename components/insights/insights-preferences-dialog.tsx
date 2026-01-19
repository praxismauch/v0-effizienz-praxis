"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Smile } from "lucide-react"

interface JournalPreferences {
  id?: string
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
  include_self_check: boolean
  next_journal_due?: string | null
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  preferences: JournalPreferences | null
  practiceId: string
  onSaved: () => void
}

export function JournalPreferencesDialog({ open, onOpenChange, preferences, practiceId, onSaved }: Props) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<JournalPreferences>>({
    enabled: true,
    frequency: "monthly",
    auto_generate: false,
    remind_admin: true,
    reminder_days_before: 3,
    include_kpis: true,
    include_team_data: true,
    include_financial_data: false,
    include_patient_data: false,
    generate_action_plan: true,
    include_self_check: true,
  })

  useEffect(() => {
    if (preferences) {
      setFormData(preferences)
    }
  }, [preferences])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/insights/preferences`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save preferences")
      }

      toast({
        title: "Einstellungen gespeichert",
        description: "Ihre Journal-Einstellungen wurden aktualisiert.",
      })
      onSaved()
    } catch (error: any) {
      console.error("Error saving preferences:", error)
      toast({
        title: "Fehler",
        description: error.message || "Die Einstellungen konnten nicht gespeichert werden.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Journal-Einstellungen</DialogTitle>
          <DialogDescription>
            Konfigurieren Sie, wie und wann Praxis-Journals generiert werden sollen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Frequency */}
          <div className="space-y-2">
            <Label>Berichtszeitraum</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value: "weekly" | "monthly" | "quarterly" | "yearly") =>
                setFormData({ ...formData, frequency: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Wöchentlich</SelectItem>
                <SelectItem value="monthly">Monatlich</SelectItem>
                <SelectItem value="quarterly">Quartalsweise</SelectItem>
                <SelectItem value="yearly">Jährlich</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Bestimmt, welchen Zeitraum jedes Journal abdeckt.</p>
          </div>

          <Separator />

          {/* Reminders */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Erinnerungen aktivieren</Label>
                <p className="text-xs text-muted-foreground">Erhalten Sie eine Benachrichtigung vor Fälligkeit.</p>
              </div>
              <Switch
                checked={formData.remind_admin}
                onCheckedChange={(checked) => setFormData({ ...formData, remind_admin: checked })}
              />
            </div>

            {formData.remind_admin && (
              <div className="space-y-2 pl-4 border-l-2 border-muted">
                <Label>Tage vor Fälligkeit</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={formData.reminder_days_before}
                  onChange={(e) =>
                    setFormData({ ...formData, reminder_days_before: Number.parseInt(e.target.value) || 3 })
                  }
                  className="w-24"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Content Options */}
          <div className="space-y-4">
            <Label className="text-base">Inhalt des Journals</Label>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-normal">KPIs einbeziehen</Label>
                <p className="text-xs text-muted-foreground">Alle definierten Kennzahlen analysieren.</p>
              </div>
              <Switch
                checked={formData.include_kpis}
                onCheckedChange={(checked) => setFormData({ ...formData, include_kpis: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-normal">Team-Daten einbeziehen</Label>
                <p className="text-xs text-muted-foreground">Mitarbeiter-Entwicklung und -Statistiken.</p>
              </div>
              <Switch
                checked={formData.include_team_data}
                onCheckedChange={(checked) => setFormData({ ...formData, include_team_data: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smile className="h-4 w-4 text-cyan-500" />
                <div>
                  <Label className="font-normal">Selbst-Check einbeziehen</Label>
                  <p className="text-xs text-muted-foreground">Persönliches Wohlbefinden dokumentieren.</p>
                </div>
              </div>
              <Switch
                checked={formData.include_self_check}
                onCheckedChange={(checked) => setFormData({ ...formData, include_self_check: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="font-normal">Aktionsplan generieren</Label>
                <p className="text-xs text-muted-foreground">KI erstellt Handlungsempfehlungen automatisch.</p>
              </div>
              <Switch
                checked={formData.generate_action_plan}
                onCheckedChange={(checked) => setFormData({ ...formData, generate_action_plan: checked })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
