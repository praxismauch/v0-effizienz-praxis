"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Calendar, Building2, Tag, Search, X } from "lucide-react"
import type { TeamMember } from "../types"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { getRoleLabel, AVAILABLE_ROLES } from "@/lib/roles"

interface MembersTabProps {
  teamMembers: TeamMember[]
  teams?: Array<{ id: string; name: string; color?: string }>
  onAddMember: () => void
  onEditMember: (member: TeamMember) => void
  onDeleteMember: (member: TeamMember) => void
}

export default function MembersTab({ teamMembers, teams = [], onAddMember, onEditMember, onDeleteMember }: MembersTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredMembers = useMemo(() => {
    let members = teamMembers || []

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      members = members.filter((m) =>
        `${m.first_name} ${m.last_name}`.toLowerCase().includes(query) ||
        m.email?.toLowerCase().includes(query) ||
        m.position?.toLowerCase().includes(query) ||
        m.department?.toLowerCase().includes(query)
      )
    }

    // Role / user group filter
    if (roleFilter !== "all") {
      members = members.filter((m) => {
        const normalizedRole = m.role?.toLowerCase().replace("_", "")
        const filterRole = roleFilter.toLowerCase().replace("_", "")
        return normalizedRole === filterRole
      })
    }

    // Status filter
    if (statusFilter !== "all") {
      members = members.filter((m) => (m.status || "active") === statusFilter)
    }

    return members
  }, [teamMembers, searchQuery, roleFilter, statusFilter])

  const activeFilterCount = (roleFilter !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0) + (searchQuery.trim() ? 1 : 0)

  const clearAllFilters = () => {
    setSearchQuery("")
    setRoleFilter("all")
    setStatusFilter("all")
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase()
  }

  const formatJoinedDate = (dateString?: string) => {
    if (!dateString) return null
    try {
      const date = new Date(dateString)
      return format(date, "MMM yyyy", { locale: de })
    } catch {
      return null
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20"
      case "inactive":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"
      case "deleted":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
      case "archived":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
      default:
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
    }
  }

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "active":
        return "Aktiv"
      case "inactive":
        return "Inaktiv"
      case "deleted":
        return "Gelöscht"
      case "archived":
        return "Archiviert"
      default:
        return "Aktiv"
    }
  }

  const getMemberTeams = (teamIds?: string[]) => {
    if (!teamIds || teamIds.length === 0) return []
    return teams.filter((team) => teamIds.includes(team.id))
  }

  const filterBar = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Mitarbeiter suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Suche leeren</span>
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Benutzergruppe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Gruppen</SelectItem>
            {AVAILABLE_ROLES.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="active">Aktiv</SelectItem>
            <SelectItem value="inactive">Inaktiv</SelectItem>
            <SelectItem value="deleted">Gelöscht</SelectItem>
            <SelectItem value="archived">Archiviert</SelectItem>
          </SelectContent>
        </Select>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground">
            <X className="h-4 w-4 mr-1" />
            Filter zurücksetzen
          </Button>
        )}
      </div>
    </div>
  )

  if (filteredMembers.length === 0) {
    return (
      <>
        {filterBar}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {activeFilterCount > 0 ? "Keine Mitglieder mit diesen Filtern gefunden" : "Keine Teammitglieder gefunden"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {activeFilterCount > 0 ? "Versuchen Sie andere Filterkriterien" : "Fügen Sie Ihr erstes Teammitglied hinzu"}
            </p>
            {activeFilterCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearAllFilters} className="mt-3">
                Filter zurücksetzen
              </Button>
            )}
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <>
    {filterBar}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredMembers.map((member) => {
        const memberTeams = getMemberTeams(member.team_ids)
        const joinedDate = formatJoinedDate(member.joined_date || member.joinedAt)

        return (
          <Card 
            key={member.id} 
            className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02]"
            onClick={() => onEditMember(member)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                  <Avatar className="h-12 w-12">
                    {member.avatar_url && (
                      <AvatarImage src={member.avatar_url} alt={`${member.first_name} ${member.last_name}`} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(member.first_name, member.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getStatusColor(member.status)}`}
                  >
                    {getStatusLabel(member.status)}
                  </Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate">
                    {member.first_name} {member.last_name}
                  </CardTitle>
                  <CardDescription className="truncate mt-0.5">{member.position || getRoleLabel(member.role)}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Email */}
                {member.email && (
                  <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                )}

                {/* Department */}
                {member.department && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    <span className="truncate">{member.department}</span>
                  </div>
                )}

                {/* Joined Date */}
                {joinedDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Dabei seit {joinedDate}</span>
                  </div>
                )}

                {/* Team Assignments */}
                {memberTeams.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {memberTeams.slice(0, 3).map((team) => (
                      <Badge 
                        key={team.id} 
                        variant="secondary" 
                        className="text-xs"
                      >
                        {team.name}
                      </Badge>
                    ))}
                    {memberTeams.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{memberTeams.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Skills */}
                {member.skills && member.skills.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Tag className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1 flex-1">
                      {member.skills.slice(0, 3).map((skill, idx) => (
                        <Badge 
                          key={idx} 
                          variant="outline" 
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {member.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{member.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-center pt-2">
                  <Button variant="outline" size="sm" className="pointer-events-none">
                    Profil ansehen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
    </>
  )
}
