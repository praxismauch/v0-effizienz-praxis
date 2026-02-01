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
import { Loader2, Sparkles, ChevronDown, Upload, User, Building2, Clock, Users } from "lucide-react"
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

interface Team {
  id: string
  name: string
  color?: string
  memberCount?: number
  isActive?: boolean
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
    assigned_teams?: string[]
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
  const [teams, setTeams] = useState<Team[]>([])
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingArbeitsplaetze, setLoadingArbeitsplaetze] = useState(false)
  const [loadingShiftTypes, setLoadingShiftTypes] = useState(false)
  const [loadingTeams, setLoadingTeams] = useState(false)
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
          // Handle different response formats: { teamMembers: [...] }, { members: [...] }, or direct array
          const members = Array.isArray(data) ? data : data?.teamMembers || data?.members || []
          setTeamMembers(members.filter((m: TeamMember) => m.id && isActiveMember(m)))
        }
      } catch (error) {
        console.error("Error fetching team members:", error)
      } finally {
        setLoadingTeamMembers(false)
      }

      setLoadingTeams(true)
      try {
        const response = await fetch(`/api/practices/${currentPractice.id}/teams`)
        if (response.ok) {
          const data = await response.json()
          setTeams(Array.isArray(data) ? data.filter((t: Team) => t.isActive !== false) : [])
        }
      } catch (error) {
        console.error("Error fetching teams:", error)
      } finally {
        setLoadingTeams(false)
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
        console.error("Error fetching orga categories:", error)
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
        console.error("Error fetching arbeitsplaetze:", error)
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
        console.error("Error fetching shift types:", error)
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
      console.error("Error generating optimization:", error)
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

  const toggleTeam = (id: string) => {
    const current = formData.assigned_teams || []
    const updated = current.includes(id) ? current.filter((t) => t !== id) : [...current, id]
    setFormData({ ...formData, assigned_teams: updated })
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
              Weisen Sie diese Zuständigkeit Personen, Teams, Arbeitsplätzen oder Schichten zu.
            </p>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="person" className="gap-1">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Person</span>
                </TabsTrigger>
                <TabsTrigger value="team" className="gap-1">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Team</span>
                </TabsTrigger>
                <TabsTrigger value="arbeitsplatz" className="gap-1">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Arbeitsplatz</span>
                </TabsTrigger>
                <TabsTrigger value="schicht" className="gap-1">
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Schicht</span>
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
                  />
                </div>

                {/* Zeit berechnen - only show if checkbox is checked */}
                {formData.calculate_time_automatically && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="time_amount">Zeitaufwand (Stunden)</Label>
                      <Input
                        id="time_amount"
                        type="text"
                        placeholder="z.B. 8"
                        value={timeAmountDisplay}
                        onChange={(e) => handleTimeAmountChange(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="time_period">pro</Label>
                      <Select
                        value={formData.estimated_time_period || "Monat"}
                        onValueChange={(value) => setFormData({ ...formData, estimated_time_period: value })}
                      >
                        <SelectTrigger id="time_period">
                          <SelectValue placeholder="Zeitraum wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monat">Monat</SelectItem>
                          <SelectItem value="Quartal">Quartal</SelectItem>
                          <SelectItem value="Jahr">Jahr</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Cannot Complete During Consultation */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cannot_complete"
                    checked={formData.cannot_complete_during_consultation || false}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, cannot_complete_during_consultation: checked as boolean })
                    }
                  />
                  <Label htmlFor="cannot_complete" className="text-sm font-normal cursor-pointer">
                    Nicht während der Sprechstunde möglich
                  </Label>
                </div>
              </TabsContent>

              <TabsContent value="team" className="space-y-4 mt-4">
                <div>
                  <Label>Teams/Gruppen zuweisen</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Wählen Sie ein oder mehrere Teams aus, die für diese Zuständigkeit verantwortlich sind.
                  </p>
                  {loadingTeams ? (
                    <div className="flex items-center gap-2 h-20 px-3 border rounded-md bg-muted/50">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Lade Teams...</span>
                    </div>
                  ) : teams.length === 0 ? (
                    <div className="flex items-center gap-2 h-20 px-3 border rounded-md bg-muted/50">
                      <span className="text-sm text-muted-foreground">Keine Teams verfügbar</span>
                    </div>
                  ) : (
                    <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                      {teams.map((team) => (
                        <div key={team.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={`team-${team.id}`}
                            checked={(formData.assigned_teams || []).includes(team.id)}
                            onCheckedChange={() => toggleTeam(team.id)}
                          />
                          <label
                            htmlFor={`team-${team.id}`}
                            className="flex items-center space-x-2 cursor-pointer flex-1"
                          >
                            <div
                              className="w-4 h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: team.color || "#64748b" }}
                            />
                            <span className="text-sm font-medium">{team.name}</span>
                            {team.memberCount !== undefined && (
                              <span className="text-xs text-muted-foreground">({team.memberCount} Mitglieder)</span>
                            )}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                  {(formData.assigned_teams || []).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {(formData.assigned_teams || []).length} Team(s) ausgewählt
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Tab 3: Arbeitsplatzbezogen */}
              <TabsContent value="arbeitsplatz" className="space-y-4 mt-4">
                <div>
                  <Label>Arbeitsplätze zuweisen</Label>
                  {loadingArbeitsplaetze ? (
                    <div className="flex items-center gap-2 h-20 px-3 border rounded-md bg-muted/50">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Lade Arbeitsplätze...</span>
                    </div>
                  ) : arbeitsplaetze.length === 0 ? (
                    <div className="flex items-center gap-2 h-20 px-3 border rounded-md bg-muted/50">
                      <span className="text-sm text-muted-foreground">Keine Arbeitsplätze verfügbar</span>
                    </div>
                  ) : (
                    <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                      {arbeitsplaetze.map((ap) => (
                        <div key={ap.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={`ap-${ap.id}`}
                            checked={(formData.assigned_arbeitsplaetze || []).includes(ap.id)}
                            onCheckedChange={() => toggleArbeitsplatz(ap.id)}
                          />
                          <label htmlFor={`ap-${ap.id}`} className="flex flex-col cursor-pointer flex-1">
                            <span className="text-sm font-medium">{ap.name}</span>
                            {ap.raum_name && <span className="text-xs text-muted-foreground">{ap.raum_name}</span>}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                  {(formData.assigned_arbeitsplaetze || []).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {(formData.assigned_arbeitsplaetze || []).length} Arbeitsplatz/plätze ausgewählt
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* Tab 4: Schichtbezogen */}
              <TabsContent value="schicht" className="space-y-4 mt-4">
                <div>
                  <Label>Schichten zuweisen</Label>
                  {loadingShiftTypes ? (
                    <div className="flex items-center gap-2 h-20 px-3 border rounded-md bg-muted/50">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Lade Schichten...</span>
                    </div>
                  ) : shiftTypes.length === 0 ? (
                    <div className="flex items-center gap-2 h-20 px-3 border rounded-md bg-muted/50">
                      <span className="text-sm text-muted-foreground">Keine Schichten verfügbar</span>
                    </div>
                  ) : (
                    <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                      {shiftTypes.map((shift) => (
                        <div key={shift.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={`shift-${shift.id}`}
                            checked={(formData.assigned_shifts || []).includes(shift.id)}
                            onCheckedChange={() => toggleShift(shift.id)}
                          />
                          <label
                            htmlFor={`shift-${shift.id}`}
                            className="flex items-center gap-2 cursor-pointer flex-1"
                          >
                            {shift.color && (
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: shift.color }}
                              />
                            )}
                            <span className="text-sm font-medium">{shift.name}</span>
                            {shift.start_time && shift.end_time && (
                              <span className="text-xs text-muted-foreground">
                                ({shift.start_time} - {shift.end_time})
                              </span>
                            )}
                          </label>
                        </div>
                      ))}
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

          {/* Advanced Options Collapsible */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                <span className="text-sm font-medium">Erweiterte Optionen</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              {/* Link URL */}
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

              {/* Link Title */}
              <div>
                <Label htmlFor="link_title">Link Titel</Label>
                <Input
                  id="link_title"
                  placeholder="Beschreibung des Links"
                  value={formData.link_title || ""}
                  onChange={(e) => setFormData({ ...formData, link_title: e.target.value })}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={onSave} disabled={!formData.name.trim()}>
            {editing ? "Speichern" : "Erstellen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
