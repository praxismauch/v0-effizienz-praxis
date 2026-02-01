"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Calendar, Check, X, Clock } from "lucide-react"
import type { HolidayRequest, TeamMember } from "../types"
import CreateHolidayRequestDialog from "./create-holiday-request-dialog"

interface HolidaysTabProps {
  holidayRequests: HolidayRequest[]
  teamMembers: TeamMember[]
  onRequestCreated: (request: HolidayRequest) => void
  onApproveRequest: (request: HolidayRequest) => void
  onRejectRequest: (request: HolidayRequest) => void
}

export default function HolidaysTab({
  holidayRequests,
  teamMembers,
  onRequestCreated,
  onApproveRequest,
  onRejectRequest,
}: HolidaysTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const getMember = (memberId: string) => {
    return teamMembers.find((m) => m.id === memberId)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Genehmigt</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Abgelehnt</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Ausstehend</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Urlaubsanträge</h3>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Antrag
        </Button>
      </div>

      <CreateHolidayRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        teamMembers={teamMembers}
        onRequestCreated={(request) => {
          onRequestCreated(request)
          setDialogOpen(false)
        }}
      />

      {holidayRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Urlaubsanträge</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Es liegen keine Urlaubsanträge vor.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {holidayRequests.map((request) => {
            const member = getMember(request.team_member_id)
            return (
              <Card key={request.id}>
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
                          {new Date(request.start_date).toLocaleDateString("de-DE")} -{" "}
                          {new Date(request.end_date).toLocaleDateString("de-DE")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                      {request.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-600"
                            onClick={() => onApproveRequest(request)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600"
                            onClick={() => onRejectRequest(request)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
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
