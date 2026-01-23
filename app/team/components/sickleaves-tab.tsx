"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Stethoscope, Clock } from "lucide-react"
import type { SickLeave, TeamMember } from "../types"

interface SickLeavesTabProps {
  sickLeaves: SickLeave[]
  teamMembers: TeamMember[]
  onCreateSickLeave: () => void
}

export default function SickLeavesTab({
  sickLeaves,
  teamMembers,
  onCreateSickLeave,
}: SickLeavesTabProps) {
  const getMember = (memberId: string) => {
    return teamMembers.find((m) => m.id === memberId)
  }

  const isOngoing = (endDate: string | null) => {
    if (!endDate) return true
    return new Date(endDate) >= new Date()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Krankmeldungen</h3>
        <Button onClick={onCreateSickLeave}>
          <Plus className="h-4 w-4 mr-2" />
          Krankmeldung erfassen
        </Button>
      </div>

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
              <Card key={leave.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member?.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>
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
                    <Badge variant={ongoing ? "destructive" : "secondary"}>
                      {ongoing ? "Aktuell krank" : "Beendet"}
                    </Badge>
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
