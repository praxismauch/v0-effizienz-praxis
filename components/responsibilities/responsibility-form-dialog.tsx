"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"
import { usePractice } from "@/contexts/practice-context"
import { Loader2, Sparkles, ChevronDown, Upload, User, Building2, Clock } from "lucide-react"
import { isActiveMember } from "@/lib/utils/team-member-filter"

interface OrgaCategory {
  id: string
  name: string
  color: string
  display_order: number
}

interface TeamMember {
  id: string
  first_name?: string
  last_name?: string
  name?: string
  isActive?: boolean
  status?: string
}

interface Arbeitsplatz {
  id: string
  name: string
  beschreibung?: string
  raum_name?: string
  is_active?: boolean
}

interface ShiftType {
  id: string
  name: string
  short_name?: string
  start_time?: string
  end_time?: string
  color?: string
  is_active?: boolean
}

interface ResponsibilityFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formData: {
    name: string
    description: string
    category: string
    responsible_user_id: string
    deputy_user_id?: string
    suggested_hours_per_week: string
    cannot_complete_during_consultation: boolean
    optimization_suggestions?: string
    calculate_time_automatically?: boolean
    estimated_time_amount?: number | null
    estimated_time_period?: string | null
    link_url?: string
    link_title?: string
    assigned_arbeitsplaetze?: string[]
    assigned_shifts?: string[]
  }
  setFormData: (data: any) => void
  hoursDisplayValue: string
  setHoursDisplayValue: (value: string) => void
  onSave: () => void
  editing: boolean
}

export function ResponsibilityFormDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  hoursDisplayValue,
  setHoursDisplayValue,
  onSave,
  editing,
}: ResponsibilityFormDialogProps) {
  const { currentPractice } = usePractice()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [orgaCategories, setOrgaCategories] = useState<OrgaCategory[]>([])
  const [arbeitsplaetze, setArbeitsplaetze] = useState<Arbeitsplatz[]>([])
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingArbeitsplaetze, setLoadingArbeitsplaetze] = useState(false)
  const [loadingShiftTypes, setLoadingShiftTypes] = useState(false)
  const [isGeneratingOptimization, setIsGeneratingOptimization] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [timeAmountDisplay, setTimeAmountDisplay] = useState("")
  const [activeTab, setActiveTab] = useState("person")

  useEffect(() => {
    const fetchData = async () => {
      if (!currentPractice?.id || !open) return

      // Fetch team members
      setLoadingTeamMembers(true)
      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/team-members`)
        if (response.ok) {
          const data = await response.json()
          const members = Array.isArray(data) ? data : data?.members || []
          setTeamMembers(members.filter((m: TeamMember) => m.id && isActiveMember(m)))
        }
      } catch (error) {
        console.error("[v0] Error fetching team members:", error)
      } finally {
        setLoadingTeamMembers(false)
      }

      // Fetch orga categories
      setLoadingCategories(true)
      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/orga-categories`)
        if (response.ok) {
          const data = await response.json()
          const categories = (data?.categories || []).sort(
            (a: OrgaCategory, b: OrgaCategory) => (a.display_order || 0) - (b.display_order || 0),
          )
          const seen = new Set<string>()
          const uniqueCategories = categories.filter((cat: OrgaCategory) => {
            const key = cat.name?.toLowerCase()?.trim()
            if (key && !seen.has(key)) {
              seen.add(key)
              return true
            }
            return false
          })
          setOrgaCategories(uniqueCategories)
        }
      } catch (error) {
        console.error("[v0] Error fetching orga categories:", error)
      } finally {
        setLoadingCategories(false)
      }

      setLoadingArbeitsplaetze(true)
      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/arbeitsplaetze`)
        if (response.ok) {
          const data = await response.json()
          const workplaces = (data?.arbeitsplaetze || data || []).filter((a: Arbeitsplatz) => a.is_active !== false)
          setArbeitsplaetze(workplaces)
        }
      } catch (error) {
        console.error("[v0] Error fetching arbeitsplaetze:", error)
      } finally {
        setLoadingArbeitsplaetze(false)
      }

      setLoadingShiftTypes(true)
      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/dienstplan/shift-types`)
        if (response.ok) {
          const data = await response.json()
          const shifts = (data?.shiftTypes || data || []).filter((s: ShiftType) => s.is_active !== false)
          setShiftTypes(shifts)
        }
      } catch (error) {
        console.error("[v0] Error fetching shift types:", error)
      } finally {
        setLoadingShiftTypes(false)
      }
    }

    fetchData()
  }, [currentPractice?.id, open])

  // Calculate hours automatically when time amount/period changes
  useEffect(() => {
    if (formData.calculate_time_automatically && formData.estimated_time_amount && formData.estimated_time_period) {
      const amount = formData.estimated_time_amount
      const period = formData.estimated_time_period
      let hoursPerWeek = 0

      switch (period) {
        case "Monat":
          hoursPerWeek = amount / 4.33
          break
        case "Quartal":
          hoursPerWeek = amount / 13
          break
        case "Jahr":
          hoursPerWeek = amount / 52
          break
      }

      const roundedHours = Math.round(hoursPerWeek * 10) / 10
      setHoursDisplayValue(roundedHours.toString().replace(".", ","))
      setFormData((prev: typeof formData) => ({
        ...prev,
        suggested_hours_per_week: roundedHours.toString(),
      }))
    }
  }, [formData.calculate_time_automatically, formData.estimated_time_amount, formData.estimated_time_period])

  const handleHoursChange = (value: string) => {
    setHoursDisplayValue(value)
    setFormData({ ...formData, suggested_hours_per_week: value })
  }

  const handleTimeAmountChange = (value: string) => {
    setTimeAmountDisplay(value)
    const parsedValue = Number.parseFloat(value.replace(",", "."))
    setFormData({ ...formData, estimated_time_amount: isNaN(parsedValue) ? null : parsedValue })
  }

  // Helper to get display name for team member
  const getTeamMemberName = (member: TeamMember) => {
    if (member.name) return member.name
    if (member.first_name || member.last_name) {
      return `${member.first_name || ""} ${member.last_name || ""}`.trim()
    }
    return "Unbekannt"
  }

  const handleGenerateOptimization = async () => {
    if (!formData.name.trim()) {
      alert("Bitte geben Sie zuerst einen Namen für die Zuständigkeit ein.")
      return
    }

    setIsGeneratingOptimization(true)
    try {
      const response = await fetch("/api/responsibilities/ai-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          group_name: formData.category,
          suggested_hours_per_week: Number.parseFloat(formData.suggested_hours_per_week?.replace(",", ".") || "0"),
          cannot_complete_during_consultation: formData.cannot_complete_during_consultation,
          practice_id: currentPractice?.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || "Fehler beim Generieren der Vorschläge")
      }

      const data = await response.json()
      setFormData({
        ...formData,
        optimization_suggestions: data.suggestions,
      })
    } catch (error) {
      console.error("[v0] Error generating optimization:", error)
      const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler"
      alert(`Fehler beim Generieren der Optimierungsvorschläge:\n${errorMessage}`)
    } finally {
      setIsGeneratingOptimization(false)
    }
  }

  const toggleArbeitsplatz = (id: string) => {
    const current = formData.assigned_arbeitsplaetze || []
    const updated = current.includes(id) ? current.filter((a) => a !== id) : [...current, id]
    setFormData({ ...formData, assigned_arbeitsplaetze: updated })
  }

  const toggleShift = (id: string) => {
    const current = formData.assigned_shifts || []
    const updated = current.includes(id) ? current.filter((s) => s !== id) : [...current, id]
    setFormData({ ...formData, assigned_shifts: updated })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Zuständigkeit bearbeiten" : "Neue Zuständigkeit"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Bearbeiten Sie die Details dieser Zuständigkeit und speichern Sie die Änderungen."
              : "Erstellen Sie eine neue Zuständigkeit für Ihr Team."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name">Name der Zuständigkeit*</Label>
            <Input
              id="name"
              placeholder="z.B. Terminverwaltung, Abrechnung, etc."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              placeholder="Beschreiben Sie die Aufgaben und Verantwortlichkeiten..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Upload className="h-3 w-3" />
              Tipp: Drücken Sie Strg+V zum Einfügen oder ziehen Sie Dateien hierher
            </p>
          </div>

          {/* KI Optimization Section */}
          <div>
            <Label>Wie können wir dies optimieren?</Label>
            <div className="mt-2 space-y-2">
              <Button
                type="button"
                onClick={handleGenerateOptimization}
                disabled={isGeneratingOptimization || !formData.name.trim()}
                className="w-full gap-2 bg-gradient-to-r from-purple-500/90 to-indigo-500/90 hover:from-purple-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300"
              >
                {isGeneratingOptimization ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="font-semibold">Generiere...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span className="font-semibold">KI-Vorschläge generieren</span>
                  </>
                )}
              </Button>
              <Textarea
                id="optimization_suggestions"
                value={formData.optimization_suggestions || ""}
                onChange={(e) => setFormData({ ...formData, optimization_suggestions: e.target.value })}
                placeholder="Ideen und Vorschläge zur Optimierung dieser Zuständigkeit"
                rows={4}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">Kategorie</Label>
            {loadingCategories ? (
              <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Lade Kategorien...</span>
              </div>
            ) : (
              <Select
                value={formData.category || "none"}
                onValueChange={(value) => setFormData({ ...formData, category: value === "none" ? "" : value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Keine Kategorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine Kategorie</SelectItem>
                  {orgaCategories.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">Keine Kategorien verfügbar</div>
                  ) : (
                    orgaCategories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: category.color || "#6366f1" }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="pt-2">
            <Label className="text-base font-semibold">Zuordnung</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Weisen Sie diese Zuständigkeit Personen, Arbeitsplätzen oder Schichten zu.
            </p>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="person" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Personenbezogen</span>
                  <span className="sm:hidden">Person</span>
                </TabsTrigger>
                <TabsTrigger value="arbeitsplatz" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Arbeitsplatzbezogen</span>
                  <span className="sm:hidden">Arbeitsplatz</span>
                </TabsTrigger>
                <TabsTrigger value="schicht" className="gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Schicht</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Personenbezogen */}
              <TabsContent value="person" className="space-y-4 mt-4">
                {/* Hauptverantwortlicher and Stellvertreter - Side by Side */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="responsible_user">Hauptverantwortlicher</Label>
                    {loadingTeamMembers ? (
                      <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Lade...</span>
                      </div>
                    ) : (
                      <Select
                        value={formData.responsible_user_id || "none"}
                        onValueChange={(value) =>
                          setFormData({ ...formData, responsible_user_id: value === "none" ? "" : value })
                        }
                      >
                        <SelectTrigger id="responsible_user">
                          <SelectValue placeholder="Nicht zugewiesen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nicht zugewiesen</SelectItem>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {getTeamMemberName(member)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="deputy_user">Stellvertreter</Label>
                    {loadingTeamMembers ? (
                      <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Lade...</span>
                      </div>
                    ) : (
                      <Select
                        value={formData.deputy_user_id || "none"}
                        onValueChange={(value) =>
                          setFormData({ ...formData, deputy_user_id: value === "none" ? "" : value })
                        }
                      >
                        <SelectTrigger id="deputy_user">
                          <SelectValue placeholder="Nicht zugewiesen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nicht zugewiesen</SelectItem>
                          {teamMembers
                            .filter((m) => m.id !== formData.responsible_user_id)
                            .map((member) => (
                              <SelectItem key={member.id} value={member.id}>
                                {getTeamMemberName(member)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* Zeitaufwand Berechnen Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="calculate_time"
                    checked={formData.calculate_time_automatically || false}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, calculate_time_automatically: checked as boolean })
                    }
                  />
                  <Label htmlFor="calculate_time" className="text-sm font-normal cursor-pointer">
                    Zeitaufwand Berechnen
                  </Label>
                </div>

                {/* Geschätzter Zeitaufwand */}
                <div>
                  <Label htmlFor="hours">Geschätzter Zeitaufwand (Std./Woche)</Label>
                  <Input
                    id="hours"
                    type="text"
                    placeholder="z.B. 4,0"
                    value={hoursDisplayValue}
                    onChange={(e) => handleHoursChange(e.target.value)}
                    disabled={formData.calculate_time_automatically}
                    className={formData.calculate_time_automatically ? "bg-muted" : ""}
                  />
                </div>

                {/* Zeitaufwand Berechnung - shown when calculate_time_automatically is checked */}
                {formData.calculate_time_automatically && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Zeitaufwand Berechnung</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="time_amount" className="text-xs text-muted-foreground">
                          Anzahl Stunden pro
                        </Label>
                        <Input
                          id="time_amount"
                          type="text"
                          placeholder="z.B. 2 oder 2,5"
                          value={timeAmountDisplay}
                          onChange={(e) => handleTimeAmountChange(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="time_period" className="text-xs text-muted-foreground">
                          Zeitraum
                        </Label>
                        <Select
                          value={formData.estimated_time_period || "none"}
                          onValueChange={(value) =>
                            setFormData({ ...formData, estimated_time_period: value === "none" ? null : value })
                          }
                        >
                          <SelectTrigger id="time_period">
                            <SelectValue placeholder="Nicht ausgewählt" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nicht ausgewählt</SelectItem>
                            <SelectItem value="Monat">Monat</SelectItem>
                            <SelectItem value="Quartal">Quartal</SelectItem>
                            <SelectItem value="Jahr">Jahr</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Kann nicht während Sprechstunde */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="consultation"
                    checked={formData.cannot_complete_during_consultation}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, cannot_complete_during_consultation: checked as boolean })
                    }
                  />
                  <Label htmlFor="consultation" className="text-sm font-normal cursor-pointer">
                    Kann nicht während Sprechstunde erledigt werden
                  </Label>
                </div>

                {formData.cannot_complete_during_consultation && (
                  <div className="ml-6 px-3 py-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md">
                    <p className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
                      <span className="font-medium">Außerhalb der Sprechstunde</span>
                      <span className="text-amber-600 dark:text-amber-400">
                        — Diese Aufgabe wird außerhalb der regulären Sprechzeiten erledigt
                      </span>
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Tab 2: Arbeitsplatzbezogen */}
              <TabsContent value="arbeitsplatz" className="space-y-4 mt-4">
                <div>
                  <Label className="mb-2 block">Arbeitsplätze zuweisen</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Wählen Sie die Arbeitsplätze aus, an denen diese Zuständigkeit ausgeführt wird.
                  </p>

                  {loadingArbeitsplaetze ? (
                    <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/50">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Lade Arbeitsplätze...</span>
                    </div>
                  ) : arbeitsplaetze.length === 0 ? (
                    <div className="p-4 border rounded-lg bg-muted/30 text-center">
                      <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Keine Arbeitsplätze verfügbar. Erstellen Sie zuerst Arbeitsplätze unter{" "}
                        <span className="font-medium">Arbeitsplätze</span>.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                      {arbeitsplaetze.map((ap) => {
                        const isSelected = (formData.assigned_arbeitsplaetze || []).includes(ap.id)
                        return (
                          <div
                            key={ap.id}
                            onClick={() => toggleArbeitsplatz(ap.id)}
                            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border hover:border-primary/50 hover:bg-muted/50"
                            }`}
                          >
                            <Checkbox checked={isSelected} onChange={() => {}} className="pointer-events-none" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{ap.name}</p>
                              {ap.raum_name && (
                                <p className="text-xs text-muted-foreground truncate">Raum: {ap.raum_name}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {(formData.assigned_arbeitsplaetze || []).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {(formData.assigned_arbeitsplaetze || []).length} Arbeitsplatz/Arbeitsplätze ausgewählt
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Tab 3: Schicht */}
              <TabsContent value="schicht" className="space-y-4 mt-4">
                <div>
                  <Label className="mb-2 block">Schichten zuweisen</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Wählen Sie die Schichten aus, während denen diese Zuständigkeit ausgeführt wird.
                  </p>

                  {loadingShiftTypes ? (
                    <div className="flex items-center gap-2 p-4 border rounded-lg bg-muted/50">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Lade Schichten...</span>
                    </div>
                  ) : shiftTypes.length === 0 ? (
                    <div className="p-4 border rounded-lg bg-muted/30 text-center">
                      <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Keine Schichttypen verfügbar. Erstellen Sie zuerst Schichten im{" "}
                        <span className="font-medium">Dienstplan</span>.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                      {shiftTypes.map((shift) => {
                        const isSelected = (formData.assigned_shifts || []).includes(shift.id)
                        return (
                          <div
                            key={shift.id}
                            onClick={() => toggleShift(shift.id)}
                            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border hover:border-primary/50 hover:bg-muted/50"
                            }`}
                          >
                            <Checkbox checked={isSelected} onChange={() => {}} className="pointer-events-none" />
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: shift.color || "#6366f1" }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {shift.name}
                                {shift.short_name && (
                                  <span className="text-muted-foreground ml-1">({shift.short_name})</span>
                                )}
                              </p>
                              {shift.start_time && shift.end_time && (
                                <p className="text-xs text-muted-foreground">
                                  {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {(formData.assigned_shifts || []).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {(formData.assigned_shifts || []).length} Schicht(en) ausgewählt
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Erweiterte Einstellungen */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                <span className="text-sm font-medium">Erweiterte Einstellungen</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div>
                <Label htmlFor="link_url">Link URL</Label>
                <Input
                  id="link_url"
                  type="url"
                  placeholder="https://..."
                  value={formData.link_url || ""}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="link_title">Link Titel</Label>
                <Input
                  id="link_title"
                  placeholder="Titel für den Link"
                  value={formData.link_title || ""}
                  onChange={(e) => setFormData({ ...formData, link_title: e.target.value })}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onSave} disabled={!formData.name}>
            {editing ? "Speichern" : "Erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
