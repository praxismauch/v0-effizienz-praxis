"use client"

import { useState } from "react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Plus, Edit, Trash2, Check, X, Clock, Palmtree, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import AvailabilityDialog from "./availability-dialog"
import type { Availability, TeamMember } from "../types"
import { DAYS_OF_WEEK } from "../types"

interface AvailabilityTabProps {
  availability: Availability[]
  teamMembers: TeamMember[]
  practiceId: string
  onRefresh: () => void
}

const getAvailabilityIcon = (type: string) => {
  switch (type) {
    case "available":
      return Check
    case "unavailable":
      return X
    case "vacation":
      return Palmtree
    case "sick":
      return AlertCircle
    default:
      return Clock
  }
}

const getAvailabilityColor = (type: string) => {
  switch (type) {
    case "available":
      return "bg-green-100 text-green-800"
    case "unavailable":
      return "bg-red-100 text-red-800"
    case "preferred":
      return "bg-blue-100 text-blue-800"
    case "vacation":
      return "bg-amber-100 text-amber-800"
    case "sick":
      return "bg-purple-100 text-purple-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getAvailabilityLabel = (type: string) => {
  switch (type) {
    case "available":
      return "Verfügbar"
    case "unavailable":
      return "Nicht verfügbar"
    case "preferred":
      return "Bevorzugt"
    case "vacation":
      return "Urlaub"
    case "sick":
      return "Krank"
    default:
      return type
  }
}

export default function AvailabilityTab({
  availability: availabilityProp,
  teamMembers: teamMembersProp,
  practiceId,
  onRefresh,
}: AvailabilityTabProps) {
  // Add null safety guards
  const availability = availabilityProp || []
  const teamMembers = teamMembersProp || []
  
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [editingAvailability, setEditingAvailability] = useState<Availability | null>(null)

  const onAddAvailability = (memberId: string) => {
    setSelectedMemberId(memberId)
    setEditingAvailability(null)
    setDialogOpen(true)
  }

  const onEditAvailability = (item: Availability) => {
    setSelectedMemberId(item.team_member_id)
    setEditingAvailability(item)
    setDialogOpen(true)
  }

  const onDeleteAvailability = async (id: string) => {
    try {
      const res = await fetch(`/api/practices/${practiceId}/dienstplan/availability/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast({ title: "Verfügbarkeit gelöscht" })
        onRefresh()
      } else {
        throw new Error("Failed to delete")
      }
    } catch {
      toast({ title: "Fehler beim Löschen", variant: "destructive" })
    }
  }

  const handleSaveAvailability = async (data: Partial<Availability>) => {
    console.log("[v0] Saving availability with data:", data)
    const isEditing = !!editingAvailability
    const url = isEditing
      ? `/api/practices/${practiceId}/dienstplan/availability/${editingAvailability.id}`
      : `/api/practices/${practiceId}/dienstplan/availability`

    console.log("[v0] Request URL:", url, "Method:", isEditing ? "PUT" : "POST")

    try {
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      console.log("[v0] Response status:", res.status)

      if (res.ok) {
        const result = await res.json()
        console.log("[v0] Save successful:", result)
        toast({ title: isEditing ? "Verfügbarkeit aktualisiert" : "Verfügbarkeit erstellt" })
        onRefresh()
      } else {
        const error = await res.json()
        console.error("[v0] Save failed with response:", error)
        throw new Error(error.error || `Failed to save availability (${res.status})`)
      }
    } catch (error) {
      console.error("[v0] Error in handleSaveAvailability:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to save availability"
      toast({ title: "Fehler beim Speichern", description: errorMessage, variant: "destructive" })
      throw error
    }
  }

  const getMember = (memberId: string) => (teamMembers || []).find((m) => m.id === memberId)

  const groupedAvailability = (teamMembers || []).map((member) => ({
    member,
    items: (availability || []).filter((a) => a.team_member_id === member.id),
  }))

  return (
    <div className="space-y-4">
      {groupedAvailability.map(({ member, items }) => (
        <Card key={member.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>
                    {member.first_name?.[0] ?? ""}
                    {member.last_name?.[0] ?? ""}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base">
                    {member.first_name} {member.last_name}
                  </CardTitle>
                  {member.role && <p className="text-sm text-muted-foreground">{member.role}</p>}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => onAddAvailability(member.id)}>
                <Plus className="h-4 w-4 mr-2" />
                Hinzufügen
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Keine Verfügbarkeiten eingetragen
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => {
                  const Icon = getAvailabilityIcon(item.availability_type)
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${getAvailabilityColor(item.availability_type)}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getAvailabilityColor(item.availability_type)}>
                              {getAvailabilityLabel(item.availability_type)}
                            </Badge>
                            {item.is_recurring && (
                              <Badge variant="secondary" className="text-xs">
                                Wiederkehrend
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.is_recurring && item.day_of_week !== undefined
                              ? DAYS_OF_WEEK[item.day_of_week]
                              : item.specific_date
                                ? format(new Date(item.specific_date), "PPP", { locale: de })
                                : "-"}
                            {item.start_time && item.end_time && (
                              <span className="ml-2">
                                {item.start_time.slice(0, 5)} - {item.end_time.slice(0, 5)}
                              </span>
                            )}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onEditAvailability(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => onDeleteAvailability(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <AvailabilityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        availability={editingAvailability}
        teamMemberId={selectedMemberId || ""}
        onSave={handleSaveAvailability}
      />
    </div>
  )
}
