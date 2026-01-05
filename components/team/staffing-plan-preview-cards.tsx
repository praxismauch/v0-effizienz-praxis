"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Users, Clock } from "lucide-react"
import type { StaffingPlan } from "@/types/staffing"

interface StaffingPlanEntry {
  id: string
  day_of_week: number
  time_slot: string
  hours: number
  team_id: string
  name?: string
  notes?: string
  team?: { name: string; color: string }
}

interface StaffingPlanPreviewCardsProps {
  plans: StaffingPlan[]
  planEntries: StaffingPlanEntry[]
  selectedPlanId: string | null
}

const DAYS_OF_WEEK = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]

export function StaffingPlanPreviewCards({ plans, planEntries, selectedPlanId }: StaffingPlanPreviewCardsProps) {
  const selectedPlan = plans.find((p) => p.id === selectedPlanId)

  if (!selectedPlan) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Bitte wählen Sie einen Plan aus oder erstellen Sie einen neuen Plan</p>
        </CardContent>
      </Card>
    )
  }

  const teamGroups = planEntries.reduce(
    (acc, entry) => {
      const teamId = entry.team_id || "unassigned"
      if (!acc[teamId]) {
        acc[teamId] = []
      }
      acc[teamId].push(entry)
      return acc
    },
    {} as Record<string, StaffingPlanEntry[]>,
  )

  const calculateTotalHours = (entries: StaffingPlanEntry[]) => {
    return entries.reduce((sum, entry) => sum + (entry.hours || 0), 0)
  }

  const getEntriesByDay = (entries: StaffingPlanEntry[]) => {
    const byDay: Record<number, StaffingPlanEntry[]> = {}
    entries.forEach((entry) => {
      if (!byDay[entry.day_of_week]) {
        byDay[entry.day_of_week] = []
      }
      byDay[entry.day_of_week].push(entry)
    })
    return byDay
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">{selectedPlan.name}</h3>
        {selectedPlan.description && <p className="text-muted-foreground mt-1">{selectedPlan.description}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(teamGroups).map(([teamId, entries]) => {
          const firstEntry = entries[0]
          const teamName = firstEntry?.team?.name || "Nicht zugewiesen"
          const teamColor = firstEntry?.team?.color || "#3b82f6"
          const totalHours = calculateTotalHours(entries)
          const entriesByDay = getEntriesByDay(entries)
          const uniqueDays = Object.keys(entriesByDay).length

          return (
            <Card key={teamId} className="relative border-2" style={{ borderColor: `${teamColor}20` }}>
              <div
                className="absolute top-4 right-4 h-3 w-3 rounded-full"
                style={{ backgroundColor: teamColor }}
                title={teamName}
              />

              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" style={{ color: teamColor }} />
                  {teamName}
                </CardTitle>
                <CardDescription>Bedarfsplan für {selectedPlan.name}</CardDescription>

                <div className="mt-4">
                  <div className="text-3xl font-bold">
                    {totalHours.toFixed(1)} <span className="text-base font-normal text-muted-foreground">Std</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">pro Woche</p>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {uniqueDays} {uniqueDays === 1 ? "Tag" : "Tage"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {entries.length} {entries.length === 1 ? "Schicht" : "Schichten"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-2 text-sm">
                  {Object.entries(entriesByDay)
                    .sort(([dayA], [dayB]) => Number(dayA) - Number(dayB))
                    .map(([day, dayEntries]) => (
                      <li key={day}>
                        <div className="font-medium text-sm mb-1">{DAYS_OF_WEEK[Number(day)]}</div>
                        <ul className="space-y-1.5 ml-2">
                          {dayEntries.map((entry) => (
                            <li key={entry.id} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="flex-1">
                                {entry.time_slot || entry.name || "Keine Zeit angegeben"} -{" "}
                                <span className="font-medium">{entry.hours}h</span>
                                {entry.notes && (
                                  <span className="text-muted-foreground text-xs ml-1">({entry.notes})</span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {Object.keys(teamGroups).length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Keine Einträge im Plan</h3>
              <p className="text-muted-foreground">
                Fügen Sie Schichten hinzu, um den Bedarfsplan für {selectedPlan.name} zu erstellen.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
