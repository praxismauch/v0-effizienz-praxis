"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/contexts/user-context"
import { Badge, Loader2, Save, RotateCcw } from "lucide-react"
import { Separator } from "@/components/ui/separator"

// All available badge keys with their labels
const BADGE_OPTIONS = [
  { key: "tasks", label: "Aufgaben", group: "Planung" },
  { key: "goals", label: "Ziele", group: "Planung" },
  { key: "workflows", label: "Workflows", group: "Planung" },
  { key: "calendar", label: "Kalender", group: "Planung" },
  { key: "dienstplan", label: "Dienstplan", group: "Planung" },
  { key: "zeiterfassung", label: "Zeiterfassung", group: "Planung" },
  { key: "teamMembers", label: "Team", group: "Team & Personal" },
  { key: "candidates", label: "Bewerber", group: "Team & Personal" },
  { key: "responsibilities", label: "Zuständigkeiten", group: "Team & Personal" },
  { key: "appraisals", label: "Mitarbeitergespräche", group: "Team & Personal" },
  { key: "skills", label: "Kompetenzen", group: "Team & Personal" },
  { key: "training", label: "Fortbildung", group: "Team & Personal" },
  { key: "surveys", label: "Umfragen", group: "Team & Personal" },
  { key: "selfcheck", label: "Selbst-Check", group: "Team & Personal" },
  { key: "organigramm", label: "Organigramm", group: "Team & Personal" },
  { key: "documents", label: "Dokumente", group: "Daten" },
  { key: "protocols", label: "Protokolle", group: "Daten" },
  { key: "contacts", label: "Kontakte", group: "Daten" },
  { key: "journal", label: "Journal", group: "Daten" },
  { key: "analytics", label: "Kennzahlen", group: "Daten" },
  { key: "knowledge", label: "Wissen", group: "Daten" },
  { key: "cirs", label: "CIRS", group: "Qualität" },
  { key: "hygiene", label: "Hygieneplan", group: "Qualität" },
  { key: "workplaces", label: "Arbeitsplätze", group: "Infrastruktur" },
  { key: "rooms", label: "Räume", group: "Infrastruktur" },
  { key: "equipment", label: "Arbeitsmittel", group: "Infrastruktur" },
  { key: "inventory", label: "Inventar", group: "Infrastruktur" },
  { key: "devices", label: "Medizingeräte", group: "Infrastruktur" },
  { key: "strategy", label: "Strategiepfad", group: "Strategie" },
  { key: "leadership", label: "Leadership", group: "Strategie" },
  { key: "wellbeing", label: "Wellbeing", group: "Strategie" },
  { key: "leitbild", label: "Leitbild", group: "Strategie" },
  { key: "tickets", label: "Support-Tickets", group: "System" },
] as const

type BadgeKey = (typeof BADGE_OPTIONS)[number]["key"]

// Group badges by their group
const groupedBadges = BADGE_OPTIONS.reduce(
  (acc, badge) => {
    if (!acc[badge.group]) {
      acc[badge.group] = []
    }
    acc[badge.group].push(badge)
    return acc
  },
  {} as Record<string, typeof BADGE_OPTIONS[number][]>
)

const GROUP_ORDER = ["Planung", "Team & Personal", "Daten", "Qualität", "Infrastruktur", "Strategie", "System"]

export function BadgeVisibilitySettings() {
  const { currentUser } = useUser()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [visibleBadges, setVisibleBadges] = useState<Record<BadgeKey, boolean>>(() => {
    // Default all badges to visible
    const defaults: Record<string, boolean> = {}
    BADGE_OPTIONS.forEach((b) => {
      defaults[b.key] = true
    })
    return defaults as Record<BadgeKey, boolean>
  })

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!currentUser?.id) return
      setIsLoading(true)

      try {
        const response = await fetch(`/api/user/preferences?userId=${currentUser.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.preferences?.badge_visibility) {
            setVisibleBadges((prev) => ({
              ...prev,
              ...data.preferences.badge_visibility,
            }))
          }
        }
      } catch (error) {
        console.error("Error loading badge preferences:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [currentUser?.id])

  const handleToggleBadge = (key: BadgeKey) => {
    setVisibleBadges((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleToggleAll = (visible: boolean) => {
    const newState: Record<string, boolean> = {}
    BADGE_OPTIONS.forEach((b) => {
      newState[b.key] = visible
    })
    setVisibleBadges(newState as Record<BadgeKey, boolean>)
  }

  const handleSave = async () => {
    if (!currentUser?.id) return
    setIsSaving(true)

    try {
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          badge_visibility: visibleBadges,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save preferences")
      }

      // Trigger a custom event so the sidebar can reload badge preferences
      window.dispatchEvent(new CustomEvent("badge-visibility-changed", { detail: visibleBadges }))

      toast({
        title: "Einstellungen gespeichert",
        description: "Ihre Badge-Einstellungen wurden aktualisiert.",
      })
    } catch (error) {
      console.error("Error saving badge preferences:", error)
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
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge className="h-5 w-5" />
          Menü-Badges
        </CardTitle>
        <CardDescription>
          Wählen Sie aus, welche Zähler in der Seitenleiste angezeigt werden sollen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleAll(true)}
            className="gap-1"
          >
            Alle anzeigen
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleToggleAll(false)}
            className="gap-1"
          >
            Alle ausblenden
          </Button>
        </div>

        <Separator />

        <div className="space-y-6">
          {GROUP_ORDER.map((groupName) => {
            const badges = groupedBadges[groupName]
            if (!badges) return null

            return (
              <div key={groupName} className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">{groupName}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {badges.map((badge) => (
                    <div
                      key={badge.key}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <Label htmlFor={`badge-${badge.key}`} className="cursor-pointer flex-1">
                        {badge.label}
                      </Label>
                      <Switch
                        id={`badge-${badge.key}`}
                        checked={visibleBadges[badge.key]}
                        onCheckedChange={() => handleToggleBadge(badge.key)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <Separator />

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => handleToggleAll(true)}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Zurücksetzen
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Speichere...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Speichern
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
