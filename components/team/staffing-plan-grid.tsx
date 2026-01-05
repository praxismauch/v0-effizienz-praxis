"use client"

import type React from "react"
import { useState, Fragment, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatGermanNumber } from "@/lib/utils/number-format"

interface Team {
  id: string
  name: string
  color: string
}

interface Responsibility {
  id: string
  name: string
  suggested_hours_per_week: number | null
  cannot_complete_during_consultation: boolean
}

interface StaffingEntry {
  id: string
  day_of_week: number
  time_slot: "am" | "pm"
  team_id: string
  hours: number
  name?: string
  notes?: string
  team?: Team
  calculate_from_timespan?: boolean
  start_time?: string
  end_time?: string
  display_order?: number // Added display_order field
}

interface StaffingPlanGridProps {
  entries: StaffingEntry[]
  teams: Team[]
  practiceId: string
  selectedPlanId: string | null
  onRefresh: () => void
  isAdmin: boolean
  responsibilities?: Responsibility[]
}

export function StaffingPlanGrid({
  entries,
  teams,
  practiceId,
  selectedPlanId,
  onRefresh,
  isAdmin,
  responsibilities = [],
}: StaffingPlanGridProps) {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<StaffingEntry | null>(null)
  const [selectedDay, setSelectedDay] = useState<number>(1)
  const [selectedSlot, setSelectedSlot] = useState<"am" | "pm">("am")
  const [selectedTeam, setSelectedTeam] = useState<string>("")
  const [hours, setHours] = useState<string>("8")
  const [entryName, setEntryName] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [useTimeCalculation, setUseTimeCalculation] = useState(false)
  const [startTime, setStartTime] = useState<string>("08:00")
  const [endTime, setEndTime] = useState<string>("16:00")
  const [filterByTeam, setFilterByTeam] = useState<string>("all")
  const [isEditing, setIsEditing] = useState(false)
  const [draggedEntry, setDraggedEntry] = useState<StaffingEntry | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<{ day: number; slot: "am" | "pm" } | null>(null)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [duplicateSourceDay, setDuplicateSourceDay] = useState<number | null>(null)
  const [duplicateTargetDay, setDuplicateTargetDay] = useState<number | null>(null)
  const [isDuplicating, setIsDuplicating] = useState(false)

  const [setEntries] = useState(() => entries) // Declare setEntries variable

  useEffect(() => {
    if (useTimeCalculation && startTime && endTime) {
      const [startHour, startMin] = startTime.split(":").map(Number)
      const [endHour, endMin] = endTime.split(":").map(Number)

      const startTotalMinutes = startHour * 60 + startMin
      const endTotalMinutes = endHour * 60 + endMin

      let diffMinutes = endTotalMinutes - startTotalMinutes

      if (diffMinutes < 0) {
        diffMinutes += 24 * 60
      }

      const calculatedHours = (diffMinutes / 60).toFixed(2)
      setHours(calculatedHours)
    }
  }, [useTimeCalculation, startTime, endTime])

  const getEntriesForSlot = (day: number, slot: "am" | "pm") => {
    const filtered = entries.filter((e) => e.day_of_week === day && e.time_slot === slot)
    if (filterByTeam && filterByTeam !== "all") {
      return filtered.filter((e) => e.team_id === filterByTeam)
    }
    return filtered
  }

  const getDailyTotalHours = (day: number) => {
    const dayEntries =
      filterByTeam && filterByTeam !== "all"
        ? entries.filter((e) => e.day_of_week === day && e.team_id === filterByTeam)
        : entries.filter((e) => e.day_of_week === day)
    return dayEntries.reduce((sum, entry) => sum + entry.hours, 0)
  }

  const getWeeklyTotalHours = () => {
    const filtered =
      filterByTeam && filterByTeam !== "all" ? entries.filter((e) => e.team_id === filterByTeam) : entries
    return filtered.reduce((sum, entry) => sum + entry.hours, 0)
  }

  const getWeeklyTotalHoursByTeam = () => {
    const teamTotals: { teamId: string; teamName: string; teamColor: string; hours: number }[] = []

    teams.forEach((team) => {
      const teamEntries = entries.filter((e) => e.team_id === team.id)
      const totalHours = teamEntries.reduce((sum, entry) => sum + entry.hours, 0)

      if (totalHours > 0) {
        teamTotals.push({
          teamId: team.id,
          teamName: team.name,
          teamColor: team.color,
          hours: totalHours,
        })
      }
    })

    const noTeamEntries = entries.filter((e) => !e.team_id)
    if (noTeamEntries.length > 0) {
      const totalHours = noTeamEntries.reduce((sum, entry) => sum + entry.hours, 0)
      teamTotals.push({
        teamId: "",
        teamName: "Ohne Team",
        teamColor: "#64748b",
        hours: totalHours,
      })
    }

    return teamTotals
  }

  const getOutsideConsultationHours = () => {
    return responsibilities.reduce((sum, resp) => {
      if (resp.cannot_complete_during_consultation && resp.suggested_hours_per_week) {
        return sum + Number(resp.suggested_hours_per_week)
      }
      return sum
    }, 0)
  }

  const handleOpenDialog = (day: number, slot: "am" | "pm", entry?: StaffingEntry) => {
    setSelectedDay(day)
    setSelectedSlot(slot)
    if (entry) {
      console.log("[v0] Opening dialog with entry data:", {
        id: entry.id,
        name: entry.name,
        calculate_from_timespan: entry.calculate_from_timespan,
        start_time: entry.start_time,
        end_time: entry.end_time,
        hours: entry.hours,
      })

      setEditingEntry(entry)
      setSelectedTeam(entry.team_id || "")
      setHours(entry.hours.toString())
      setEntryName(entry.name || "")
      setNotes(entry.notes || "")
      const useCalc = entry.calculate_from_timespan ?? false
      const startT = entry.start_time ?? "08:00"
      const endT = entry.end_time ?? "16:00"

      console.log("[v0] Setting form values:", {
        useTimeCalculation: useCalc,
        startTime: startT,
        endTime: endT,
      })

      setUseTimeCalculation(useCalc)
      setStartTime(startT)
      setEndTime(endT)
      setIsEditing(true)
    } else {
      setEditingEntry(null)
      setSelectedTeam("")
      setHours("8")
      setEntryName("")
      setNotes("")
      setUseTimeCalculation(false)
      setStartTime("08:00")
      setEndTime("16:00")
      setIsEditing(false)
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!entryName.trim()) {
      toast({ title: "Fehler", description: "Bitte geben Sie einen Namen ein.", variant: "destructive" })
      return
    }

    if (useTimeCalculation && (!startTime || !endTime)) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie Start- und Endzeit ein.",
        variant: "destructive",
      })
      return
    }

    const numHours = Number.parseFloat(hours)
    if (isNaN(numHours) || numHours <= 0) {
      toast({ title: "Fehler", description: "Bitte geben Sie gültige Arbeitsstunden ein.", variant: "destructive" })
      return
    }

    try {
      const entryData = {
        practice_id: practiceId,
        plan_id: selectedPlanId,
        day_of_week: selectedDay,
        time_slot: selectedSlot,
        team_id: selectedTeam || null,
        name: entryName,
        hours: numHours,
        notes,
        calculate_from_timespan: useTimeCalculation,
        start_time: useTimeCalculation ? startTime : null,
        end_time: useTimeCalculation ? endTime : null,
      }

      const url = editingEntry
        ? `/api/practices/${practiceId}/staffing-plan/${editingEntry.id}`
        : `/api/practices/${practiceId}/staffing-plan`

      const res = await fetch(url, {
        method: editingEntry ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryData),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error("[v0] Failed to save staffing entry:", errorData)
        throw new Error(errorData.error || "Fehler beim Speichern")
      }

      toast({
        title: "Erfolg",
        description: editingEntry ? "Eintrag aktualisiert" : "Eintrag erstellt",
      })

      setDialogOpen(false)
      onRefresh()
    } catch (error) {
      console.error("[v0] Error saving staffing entry:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Eintrag konnte nicht gespeichert werden",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (entryId: string) => {
    try {
      const res = await fetch(`/api/practices/${practiceId}/staffing-plan/${entryId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Fehler beim Löschen")

      toast({
        title: "Erfolg",
        description: "Eintrag gelöscht",
      })

      onRefresh()
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Eintrag konnte nicht gelöscht werden",
        variant: "destructive",
      })
    }
  }

  const handleDragStart = (e: React.DragEvent, entry: StaffingEntry) => {
    setDraggedEntry(entry)
    e.dataTransfer.effectAllowed = "move"
    // Make the drag image slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "0.5"
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1"
    }
    setDraggedEntry(null)
    setDragOverSlot(null)
  }

  const handleDragOver = (e: React.DragEvent, day: number, slot: "am" | "pm") => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverSlot({ day, slot })
  }

  const handleDragLeave = () => {
    setDragOverSlot(null)
  }

  const handleDrop = async (e: React.DragEvent, targetDay: number, targetSlot: "am" | "pm") => {
    e.preventDefault()
    setDragOverSlot(null)

    if (!draggedEntry || !isAdmin) return

    // If dropping in the same slot, reorder within the slot
    if (draggedEntry.day_of_week === targetDay && draggedEntry.time_slot === targetSlot) {
      setDraggedEntry(null)
      return
    }

    try {
      // Get the next display_order for the target slot
      const targetSlotEntries = getEntriesForSlot(targetDay, targetSlot)
      const maxDisplayOrder =
        targetSlotEntries.length > 0 ? Math.max(...targetSlotEntries.map((e) => e.display_order || 0)) : 0
      const nextDisplayOrder = maxDisplayOrder + 1

      // Update the entry with new day, slot, and display_order
      const response = await fetch(`/api/practices/${practiceId}/staffing-plan/${draggedEntry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draggedEntry,
          day_of_week: targetDay,
          time_slot: targetSlot,
          display_order: nextDisplayOrder, // Set display_order to end of target slot
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to move entry")
      }

      const updatedEntry = await response.json()

      // Update local state
      setEntries((prev) => prev.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry)))

      toast({
        title: "Eintrag verschoben",
        description: `${draggedEntry.name || "Eintrag"} wurde erfolgreich verschoben.`,
      })
    } catch (error) {
      console.error("Error moving entry:", error)
      toast({
        title: "Fehler",
        description: error instanceof Error ? error.message : "Eintrag konnte nicht verschoben werden.",
        variant: "destructive",
      })
    } finally {
      setDraggedEntry(null)
    }
  }

  const handleDuplicateDay = async (sourceDay: number, targetDay: number) => {
    const sourceDayEntries = entries.filter((e) => e.day_of_week === sourceDay)
    const targetDayEntries = entries.filter((e) => e.day_of_week === targetDay)

    if (sourceDayEntries.length === 0) {
      toast({
        title: "Keine Einträge",
        description: "Der Quelltag hat keine Einträge zum Duplizieren.",
        variant: "destructive",
      })
      return
    }

    // Check if target day has entries and ask for confirmation
    if (targetDayEntries.length > 0) {
      // Show confirmation - this will be handled by opening the dialog
      setDuplicateSourceDay(sourceDay)
      setDuplicateTargetDay(targetDay)
      setDuplicateDialogOpen(true)
      return
    }

    // If no entries exist, proceed with duplication
    await performDuplication(sourceDay, targetDay, false)
  }

  const performDuplication = async (sourceDay: number, targetDay: number, deleteExisting: boolean) => {
    setIsDuplicating(true)
    try {
      const response = await fetch(`/api/practices/${practiceId}/staffing-plan/duplicate-day`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlanId,
          sourceDay,
          targetDay,
          deleteExisting,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to duplicate")
      }

      const result = await response.json()

      toast({
        title: "Erfolg",
        description: `${result.count} Einträge wurden dupliziert.`,
      })

      setDuplicateDialogOpen(false)
      onRefresh()
    } catch (error) {
      console.error("[v0] Error duplicating day:", error)
      toast({
        title: "Fehler",
        description: "Tag konnte nicht dupliziert werden",
        variant: "destructive",
      })
    } finally {
      setIsDuplicating(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <Label htmlFor="team-filter" className="text-sm font-medium">
            Team / Gruppe
          </Label>
          <Select value={filterByTeam} onValueChange={setFilterByTeam}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Alle Teams anzeigen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Teams</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
                    {team.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filterByTeam && filterByTeam !== "all" && (
            <Badge
              variant="outline"
              className="text-white border-0"
              style={{
                backgroundColor: teams.find((t) => t.id === filterByTeam)?.color || "#64748b",
              }}
            >
              {teams.find((t) => t.id === filterByTeam)?.name}
            </Badge>
          )}
        </div>

        <div className="grid gap-0.5 items-start" style={{ gridTemplateColumns: "24px repeat(5, 1fr)" }}>
          <div className="font-semibold"></div>
          {["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"].map((day, index) => (
            <div key={day} className="relative">
              <div className="font-bold text-center text-base border-b-2 border-primary/20 pb-2 flex items-center justify-center gap-1">
                {day}
                {isAdmin && index < 4 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 rounded-full hover:bg-primary/10"
                    title={`${day} → ${["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"][index + 1]} duplizieren`}
                    onClick={() => handleDuplicateDay(index + 1, index + 2)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </Button>
                )}
              </div>
            </div>
          ))}

          {(["am", "pm"] as const).map((slot) => (
            <Fragment key={slot}>
              <div
                className={`font-bold text-sm flex items-center justify-center py-2 w-8 ${
                  slot === "am" ? "text-blue-600" : "text-orange-600"
                }`}
              >
                <span className="transform -rotate-90 whitespace-nowrap text-sm font-semibold">
                  {slot === "am" ? "Vormittag" : "Nachmittag"}
                </span>
              </div>
              {["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"].map((day, dayIndex) => {
                const dayNumber = dayIndex + 1
                const slotEntries = getEntriesForSlot(dayNumber, slot as "am" | "pm")
                const isDropTarget = dragOverSlot?.day === dayNumber && dragOverSlot?.slot === slot

                return (
                  <Card
                    key={`${day}-${slot}`}
                    className={`hover:shadow-md transition-all duration-200 border min-h-[80px] ${
                      isDropTarget ? "ring-2 ring-primary bg-primary/5" : ""
                    }`}
                    onDragOver={(e) => handleDragOver(e, dayNumber, slot as "am" | "pm")}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dayNumber, slot as "am" | "pm")}
                  >
                    <CardContent className="p-1.5">
                      <div className="space-y-1.5">
                        {slotEntries.map((entry) => (
                          <div
                            key={entry.id}
                            draggable={isAdmin}
                            onDragStart={(e) => handleDragStart(e, entry)}
                            onDragEnd={handleDragEnd}
                            className={`p-1.5 border rounded bg-card shadow-sm group relative ${
                              isAdmin ? "cursor-move" : ""
                            } ${draggedEntry?.id === entry.id ? "opacity-50" : ""}`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <Badge
                                  className="text-[10px] leading-tight font-semibold text-white border-0 px-1.5 py-0.5"
                                  style={{ backgroundColor: entry.team?.color || "#64748b" }}
                                >
                                  {entry.team?.name || "Kein Team"}
                                </Badge>
                                {entry.name && (
                                  <p className="text-xs font-bold leading-tight break-words">{entry.name}</p>
                                )}
                                <p className="text-sm font-bold text-primary">{entry.hours}h</p>
                                {entry.notes && (
                                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">
                                    {entry.notes}
                                  </p>
                                )}
                              </div>
                              {isAdmin && (
                                <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => {
                                      handleOpenDialog(dayNumber, slot as "am" | "pm", entry)
                                    }}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() => {
                                      const duplicateData = {
                                        practice_id: practiceId,
                                        plan_id: selectedPlanId,
                                        day_of_week: entry.day_of_week,
                                        time_slot: entry.time_slot,
                                        team_id: entry.team_id || null,
                                        name: `${entry.name || ""} (Kopie)`,
                                        hours: entry.hours,
                                        notes: entry.notes || "",
                                        calculate_from_timespan: entry.calculate_from_timespan || false,
                                        start_time: entry.start_time || null,
                                        end_time: entry.end_time || null,
                                      }

                                      fetch(`/api/practices/${practiceId}/staffing-plan`, {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(duplicateData),
                                      })
                                        .then((res) => {
                                          if (!res.ok) throw new Error("Fehler beim Duplizieren")
                                          toast({
                                            title: "Erfolg",
                                            description: "Eintrag wurde dupliziert",
                                          })
                                          onRefresh()
                                        })
                                        .catch((error) => {
                                          console.error("[v0] Error duplicating entry:", error)
                                          toast({
                                            title: "Fehler",
                                            description: "Eintrag konnte nicht dupliziert werden",
                                            variant: "destructive",
                                          })
                                        })
                                    }}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      handleDelete(entry.id)
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {isAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-7 border-dashed border hover:bg-accent hover:border-solid bg-transparent text-xs"
                            onClick={() => handleOpenDialog(dayIndex + 1, slot as "am" | "pm")}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Neu
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </Fragment>
          ))}

          <div className="font-bold text-sm flex items-center border-t-2 border-primary/30 pt-3">Gesamt</div>
          {["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"].map((day, dayIndex) => {
            const dayNumber = dayIndex + 1
            const totalHours = getDailyTotalHours(dayNumber)

            return (
              <div key={`total-${day}`} className="flex items-center justify-center border-t-2 border-primary/30 pt-3">
                <div className="text-center bg-primary/10 rounded-lg px-3 py-2 w-full">
                  <p className="text-2xl font-bold text-primary">{totalHours}h</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Tagesstunden</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="border-t-2 border-primary/20 mt-6 pt-6">
          <div className="flex items-center justify-end gap-6">
            <p className="text-xl font-bold">
              {filterByTeam && filterByTeam !== "all"
                ? `Wochentotal (${teams.find((t) => t.id === filterByTeam)?.name}):`
                : "Wochentotal:"}
            </p>
            <div className="text-center bg-primary rounded-xl px-8 py-4 shadow-lg">
              <p className="text-4xl font-bold text-white">{getWeeklyTotalHours()}h</p>
              <p className="text-sm text-white/90 font-medium">
                {filterByTeam && filterByTeam !== "all" ? "Team-Wochenstunden" : "Gesamt pro Woche"}
              </p>
            </div>
          </div>
        </div>

        {(!filterByTeam || filterByTeam === "all") && getWeeklyTotalHoursByTeam().length > 0 && (
          <div className="border-t-2 border-muted mt-6 pt-6">
            <h3 className="text-xl font-bold mb-4">Wochentotal nach Team / Gruppe</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getWeeklyTotalHoursByTeam().map((teamTotal) => (
                <Card key={teamTotal.teamId || "no-team"} className="hover:shadow-lg transition-all border-2">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-5 h-5 rounded-full shadow-sm"
                          style={{ backgroundColor: teamTotal.teamColor }}
                        />
                        <div>
                          <p className="font-bold text-base">{teamTotal.teamName}</p>
                          <p className="text-xs text-muted-foreground">Wochenstunden</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-primary">{teamTotal.hours}h</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t-2 border-primary/20">
              <div className="flex items-center justify-end gap-6">
                <p className="text-xl font-bold">Gesamtsumme (alle Teams):</p>
                <div className="text-center bg-primary rounded-xl px-8 py-4 border-2 border-primary/30 shadow-lg">
                  <p className="text-4xl font-bold text-white">{getWeeklyTotalHours()}h</p>
                  <p className="text-sm text-white/90">Wochenstunden gesamt</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {(!filterByTeam || filterByTeam === "all") && getOutsideConsultationHours() > 0 && (
          <div className="border-t border-muted/50 pt-4">
            <div className="flex items-center justify-end gap-6">
              <p className="text-base font-semibold text-muted-foreground">
                Zeitbedarf Zuständigkeiten außerhalb der Sprechstunde:
              </p>
              <div className="text-center bg-orange-500 rounded-lg px-6 py-3 shadow-md">
                <p className="text-2xl font-bold text-white">{formatGermanNumber(getOutsideConsultationHours())}h</p>
                <p className="text-xs text-white/90">pro Woche</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Eintrag bearbeiten" : "Neuer Eintrag"}</DialogTitle>
            <DialogDescription>
              {["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"][selectedDay - 1]} -{" "}
              {selectedSlot === "am" ? "Vormittag" : "Nachmittag"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="entryName">Eintrag Name *</Label>
              <Input
                id="entryName"
                value={entryName}
                onChange={(e) => setEntryName(e.target.value)}
                placeholder="z.B. Sprechstunde, Notdienst, etc."
                required
              />
            </div>

            <div>
              <Label htmlFor="team">Team / Gruppe</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Team auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      <Badge className={team.color}>{team.name}</Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/30">
              <input
                type="checkbox"
                id="useTimeCalc"
                checked={useTimeCalculation}
                onChange={(e) => setUseTimeCalculation(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="useTimeCalc" className="cursor-pointer font-normal">
                Stunden aus Zeitspanne berechnen
              </Label>
            </div>

            {useTimeCalculation ? (
              <div className="space-y-4 p-4 border rounded-lg bg-secondary/10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Startzeit *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">Endzeit *</Label>
                    <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </div>
                </div>
                <div className="text-center p-3 bg-primary/10 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Berechnete Arbeitsstunden</p>
                  <p className="text-2xl font-bold text-primary">{hours}h</p>
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor="hours">Arbeitsstunden *</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="z.B. 8"
                />
              </div>
            )}

            <div>
              <Label htmlFor="notes">Notizen (optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Zusätzliche Informationen"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSave}>{editingEntry ? "Aktualisieren" : "Erstellen"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tag duplizieren</DialogTitle>
            <DialogDescription>
              {duplicateSourceDay && duplicateTargetDay && (
                <>
                  Möchten Sie alle Einträge von{" "}
                  <strong>{["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"][duplicateSourceDay - 1]}</strong>{" "}
                  nach{" "}
                  <strong>{["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"][duplicateTargetDay - 1]}</strong>{" "}
                  kopieren?
                  <br />
                  <br />
                  <span className="text-orange-600 font-semibold">
                    Achtung: Der Zieltag hat bereits{" "}
                    {entries.filter((e) => e.day_of_week === duplicateTargetDay).length} Einträge.
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)} disabled={isDuplicating}>
              Abbrechen
            </Button>
            <Button
              variant="outline"
              disabled={isDuplicating}
              onClick={() => {
                if (duplicateSourceDay && duplicateTargetDay) {
                  performDuplication(duplicateSourceDay, duplicateTargetDay, false)
                }
              }}
            >
              {isDuplicating ? "Wird dupliziert..." : "Hinzufügen (behalten)"}
            </Button>
            <Button
              variant="destructive"
              disabled={isDuplicating}
              onClick={() => {
                if (duplicateSourceDay && duplicateTargetDay) {
                  performDuplication(duplicateSourceDay, duplicateTargetDay, true)
                }
              }}
            >
              {isDuplicating ? "Wird dupliziert..." : "Überschreiben (löschen)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
