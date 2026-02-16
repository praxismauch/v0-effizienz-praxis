"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Stethoscope, Clock, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { usePractice } from "@/contexts/practice-context"
import type { SickLeave, TeamMember } from "../types"
import CreateSickLeaveDialog from "./create-sick-leave-dialog"

interface SickLeavesTabProps {
  sickLeaves: SickLeave[]
  teamMembers: TeamMember[]
  onSickLeaveCreated: (sickLeave: SickLeave) => void
  onSickLeaveUpdated?: () => void
}

export default function SickLeavesTab({
  sickLeaves,
  teamMembers,
  onSickLeaveCreated,
  onSickLeaveUpdated,
}: SickLeavesTabProps) {
  const { currentPractice } = usePractice()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLeave, setEditingLeave] = useState<SickLeave | null>(null)

  const getMember = (memberId: string) => {
    return teamMembers.find((m) => m.id === memberId)
  }

  const isOngoing = (endDate: string | null) => {
    if (!endDate) return true
    return new Date(endDate) >= new Date()
  }

  const handleEdit = (leave: SickLeave) => {
    setEditingLeave(leave)
    setDialogOpen(true)
  }

  const handleDelete = async (leave: SickLeave) => {
    if (!confirm("Möchten Sie diese Krankmeldung wirklich löschen?")) return

    try {
      const res = await fetch(
        `/api/practices/${currentPractice?.id}/sick-leaves/${leave.id}`,
        { method: "DELETE" }
      )

      if (res.ok) {
        toast.success("Krankmeldung gelöscht")
        onSickLeaveUpdated?.()
      } else {
        const data = await res.json()
        toast.error(data.error || "Fehler beim Löschen")
      }
    } catch {
      toast.error("Fehler beim Löschen der Krankmeldung")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Krankmeldungen</h3>
        <Button onClick={() => { setEditingLeave(null); setDialogOpen(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Krankmeldung erfassen
        </Button>
      </div>

      <CreateSickLeaveDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingLeave(null)
        }}
        teamMembers={teamMembers}
        editingLeave={editingLeave}
        onSickLeaveCreated={(sickLeave) => {
          onSickLeaveCreated(sickLeave)
          setEditingLeave(null)
          setDialogOpen(false)
        }}
      />

      {sickLeaves.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Stethoscope className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Krankmeldungen</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Es liegen keine Krankmeldungen vor.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sickLeaves.map((leave) => {
            const member = getMember(leave.team_member_id)
            const ongoing = isOngoing(leave.end_date)
            return (
              <Card key={leave.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        {member?.avatar_url && <AvatarImage src={member.avatar_url} />}
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {member?.first_name?.[0]}
                          {member?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member?.first_name} {member?.last_name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(leave.start_date).toLocaleDateString("de-DE")}
                          {leave.end_date
                            ? ` - ${new Date(leave.end_date).toLocaleDateString("de-DE")}`
                            : " - Offen"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(leave)}
                          title="Bearbeiten"
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-destructive"
                          onClick={() => handleDelete(leave)}
                          title="Löschen"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                      <Badge variant={ongoing ? "destructive" : "secondary"}>
                        {ongoing ? "Aktuell krank" : "Beendet"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
