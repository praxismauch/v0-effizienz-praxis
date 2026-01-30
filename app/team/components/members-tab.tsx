"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Users } from "lucide-react"
import type { TeamMember } from "../types"

interface MembersTabProps {
  teamMembers: TeamMember[]
  onAddMember: () => void
  onEditMember: (member: TeamMember) => void
  onDeleteMember: (member: TeamMember) => void
}

export default function MembersTab({ teamMembers, onAddMember, onEditMember, onDeleteMember }: MembersTabProps) {
  const filteredMembers = teamMembers || []

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase()
  }

  if (filteredMembers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Keine Teammitglieder gefunden</p>
          <p className="text-sm text-muted-foreground mt-1">
            Fügen Sie Ihr erstes Teammitglied hinzu
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredMembers.map((member) => (
        <Card 
          key={member.id} 
          className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
          onClick={() => onEditMember(member)}
        >
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
              {member.email && (
                <p className="text-sm text-muted-foreground truncate">{member.email}</p>
              )}
              <div className="flex justify-center">
                <Button variant="outline" size="sm" className="pointer-events-none">
                  Profil ansehen
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
