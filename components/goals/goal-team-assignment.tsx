import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Loader2 } from "lucide-react"
import { isActiveMember } from "@/lib/utils/team-member-filter"

interface Team {
  id: string
  name: string
  color?: string
  memberCount?: number
  isActive?: boolean
}

interface TeamMember {
  id: string
  name?: string
  email: string
  avatar?: string
}

interface GoalTeamAssignmentProps {
  teams: Team[]
  teamMembers: TeamMember[]
  selectedTeams: string[]
  setSelectedTeams: (teams: string[]) => void
  selectedTeamMembers: string[]
  setSelectedTeamMembers: (members: string[]) => void
  loadingTeams: boolean
  isTeamLoading: boolean
}

export function GoalTeamAssignment({
  teams,
  teamMembers,
  selectedTeams,
  setSelectedTeams,
  selectedTeamMembers,
  setSelectedTeamMembers,
  loadingTeams,
  isTeamLoading,
}: GoalTeamAssignmentProps) {
  return (
    <>
      {/* Team Assignment */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Teams zuweisen
        </Label>
        {loadingTeams ? (
          <div className="flex items-center gap-2 h-16 px-3 border rounded-md bg-muted/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Lade Teams...</span>
          </div>
        ) : teams.length > 0 ? (
          <div className="border rounded-md p-3 max-h-32 overflow-y-auto space-y-2">
            {teams.map((team) => (
              <div key={team.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`team-${team.id}`}
                  checked={selectedTeams.includes(team.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTeams([...selectedTeams, team.id])
                    } else {
                      setSelectedTeams(selectedTeams.filter((id) => id !== team.id))
                    }
                  }}
                />
                <label htmlFor={`team-${team.id}`} className="flex items-center space-x-2 cursor-pointer flex-1">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: team.color || "#64748b" }}
                  />
                  <span className="text-sm font-medium">{team.name}</span>
                </label>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground border rounded-md p-3">Keine Teams verfügbar</p>
        )}
      </div>

      {/* Team Members Assignment */}
      <div className="space-y-2">
        <Label>Zugewiesene Teammitglieder</Label>
        <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
          {isTeamLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Lade Teammitglieder...</span>
            </div>
          ) : teamMembers && teamMembers.length > 0 ? (
            teamMembers.filter(isActiveMember).map((member) => (
              <div key={member.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`member-${member.id}`}
                  checked={selectedTeamMembers.includes(member.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTeamMembers([...selectedTeamMembers, member.id])
                    } else {
                      setSelectedTeamMembers(selectedTeamMembers.filter((id) => id !== member.id))
                    }
                  }}
                />
                <label htmlFor={`member-${member.id}`} className="flex items-center space-x-2 cursor-pointer flex-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={member.avatar || ""} />
                    <AvatarFallback className="text-xs">
                      {member.name?.split(" ")[0]?.[0]?.toUpperCase() || ""}
                      {member.name?.split(" ")[1]?.[0]?.toUpperCase() || ""}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{member.name || member.email}</span>
                </label>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Keine Teammitglieder verfügbar</p>
          )}
        </div>
        {selectedTeamMembers.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">{selectedTeamMembers.length} Teammitglied(er) ausgewählt</p>
        )}
      </div>
    </>
  )
}
