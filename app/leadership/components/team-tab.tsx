"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Users } from "lucide-react"
import type { TeamMember } from "@/contexts/team-context"
import { getScoreColor } from "../types"

interface TeamTabProps {
  teamMembers: TeamMember[]
  isLoading: boolean
}

export default function TeamTab({ teamMembers, isLoading }: TeamTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!teamMembers || teamMembers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Keine Teammitglieder gefunden</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {teamMembers.filter((m) => m.isActive !== false).map((member) => (
        <Card key={member.id}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={member.avatar || "/placeholder.svg"} />
                <AvatarFallback>
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.role || "Teammitglied"}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Status</span>
                <span className="text-emerald-500">Aktiv</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Teams</span>
                <span className="text-muted-foreground">{member.teamIds?.length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Berechtigungen</span>
                <span className="text-muted-foreground">{member.permissions?.length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
