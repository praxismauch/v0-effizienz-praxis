"use client"

import { SelectItem } from "@/components/ui/select"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || ""
  const last = lastName?.charAt(0)?.toUpperCase() || ""
  return first + last || "?"
}

interface TeamMemberSelectItemProps {
  value: string
  firstName?: string
  lastName?: string
  name?: string
  avatarUrl?: string | null
  role?: string
}

export function TeamMemberSelectItem({
  value,
  firstName,
  lastName,
  name,
  avatarUrl,
  role,
}: TeamMemberSelectItemProps) {
  const displayName = name || `${firstName || ""} ${lastName || ""}`.trim() || "Unbekannt"
  const initials = getInitials(firstName, lastName)

  return (
    <SelectItem value={value}>
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={displayName} />
          ) : null}
          <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span>{displayName}</span>
        {role && (
          <span className="text-xs text-muted-foreground ml-auto">{role}</span>
        )}
      </div>
    </SelectItem>
  )
}
