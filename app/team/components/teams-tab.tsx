"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Users, Edit, Trash2 } from "lucide-react"
import type { Team, TeamMember } from "../types"

interface TeamsTabProps {
  teams: Team[]
  teamMembers: TeamMember[]
  onCreateTeam: () => void
  onEditTeam: (team: Team) => void
  onDeleteTeam: (team: Team) => void
}

export default function TeamsTab({
  teams,
  teamMembers,
  onCreateTeam,
  onEditTeam,
  onDeleteTeam,
}: TeamsTabProps) {
  const getTeamMembers = (teamId: string) => {
    return teamMembers.filter((m) => m.team_id === teamId)
  }

  if (teams.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Keine Teams</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Erstellen Sie Teams, um Ihre Mitarbeiter zu organisieren.
          </p>
          <Button onClick={onCreateTeam}>
            <Plus className="h-4 w-4 mr-2" />
            Team erstellen
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Teams</h3>
        <Button onClick={onCreateTeam}>
          <Plus className="h-4 w-4 mr-2" />
          Neues Team
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => {
          const members = getTeamMembers(team.id)
          return (
            <Card key={team.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{team.name}</CardTitle>
                    {team.description && (
                      <CardDescription className="mt-1">{team.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onEditTeam(team)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDeleteTeam(team)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{members.length} Mitglieder</Badge>
                </div>
                <div className="flex -space-x-2">
                  {members.slice(0, 5).map((member) => (
                    <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>
                        {member.first_name?.[0]}
                        {member.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {members.length > 5 && (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                      +{members.length - 5}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
