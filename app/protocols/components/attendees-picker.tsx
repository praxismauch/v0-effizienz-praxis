"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface TeamMember {
  id: string
  name: string
  role?: string
  avatar_url?: string
  user_id?: string
  team_member_id?: string
}

interface AttendeesPickerInlineProps {
  teamMembers: TeamMember[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function AttendeesPickerInline({ teamMembers, selectedIds, onChange }: AttendeesPickerInlineProps) {
  const toggleMember = (memberId: string) => {
    if (selectedIds.includes(memberId)) {
      onChange(selectedIds.filter((id) => id !== memberId))
    } else {
      onChange([...selectedIds, memberId])
    }
  }

  const selectAll = () => {
    const allIds = teamMembers
      .map((m: any) => m.user_id || m.id || m.team_member_id)
      .filter(Boolean) as string[]
    onChange(allIds)
  }

  const deselectAll = () => {
    onChange([])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Anwesende Teilnehmer
        </Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {selectedIds.length} / {teamMembers.length}
          </span>
          {selectedIds.length < teamMembers.length ? (
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={selectAll}>
              Alle
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={deselectAll}>
              Keine
            </Button>
          )}
        </div>
      </div>

      {teamMembers.length > 0 ? (
        <div className="border rounded-lg p-3 bg-muted/30 grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
          {teamMembers.map((member: any) => {
            const memberId = member.user_id || member.id || member.team_member_id
            if (!memberId) return null
            const isSelected = selectedIds.includes(memberId)
            return (
              <button
                key={memberId}
                type="button"
                onClick={() => toggleMember(memberId)}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md text-left transition-colors text-sm",
                  isSelected
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-background border border-transparent hover:bg-muted"
                )}
              >
                <Checkbox checked={isSelected} className="pointer-events-none" />
                <Avatar className="h-6 w-6">
                  <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">{member.name?.charAt(0) || "?"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <span className="truncate block">{member.name}</span>
                  {member.role && <span className="text-xs text-muted-foreground truncate block">{member.role}</span>}
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Keine Teammitglieder verfuegbar</p>
      )}
    </div>
  )
}
