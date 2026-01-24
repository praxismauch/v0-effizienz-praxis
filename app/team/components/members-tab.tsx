"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users } from "lucide-react"
import type { TeamMember, Team } from "../types"
import { getTeamColor } from "../types"

interface MembersTabProps {
  members: TeamMember[]
  teams: Team[]
  searchTerm: string
  isAdmin: boolean
}

export default function MembersTab({ members, teams, searchTerm, isAdmin }: MembersTabProps) {
  const filteredMembers = (members || []).filter(
    (member) =>
      member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.position?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase()
  }

  const getMemberTeams = (member: TeamMember) => {
    if (!member.team_ids || member.team_ids.length === 0) return []
    return (teams || []).filter((team) => member.team_ids?.includes(team.id))
  }

  if (filteredMembers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Keine Teammitglieder gefunden</p>
          <p className="text-sm text-muted-foreground mt-1">
            {searchTerm ? "Passen Sie Ihre Suche an" : "Fügen Sie Ihr erstes Teammitglied hinzu"}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredMembers.map((member) => (
        <Card key={member.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={member.avatar_url || "/placeholder.svg"} alt={`${member.first_name} ${member.last_name}`} />
                <AvatarFallback>{getInitials(member.first_name, member.last_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base truncate">
                  {member.first_name} {member.last_name}
                </CardTitle>
                <CardDescription className="truncate">{member.position || member.role}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {getMemberTeams(member).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {getMemberTeams(member).map((team) => (
                    <Badge
                      key={team.id}
                      variant="outline"
                      style={{
                        borderColor: getTeamColor(team.color),
                        backgroundColor: `${getTeamColor(team.color)}15`,
                      }}
                    >
                      {team.name}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/team/${member.id}`}>Profil ansehen</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
