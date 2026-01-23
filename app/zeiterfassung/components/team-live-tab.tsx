"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Coffee, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { TeamMember, WORK_LOCATIONS } from "../types"

interface TeamLiveTabProps {
  teamMembers: TeamMember[]
  teamFilter: string
  setTeamFilter: (filter: string) => void
}

// Format Minuten zu Stunden
const formatMinutes = (minutes: number) => {
  const h = Math.floor(Math.abs(minutes) / 60)
  const m = Math.abs(minutes) % 60
  const sign = minutes < 0 ? "-" : ""
  return `${sign}${h}h ${m}min`
}

export default function TeamLiveTab({ teamMembers, teamFilter, setTeamFilter }: TeamLiveTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Team-Anwesenheit</CardTitle>
            <CardDescription>Live-Übersicht aller Teammitglieder</CardDescription>
          </div>
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Alle anzeigen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle anzeigen</SelectItem>
              <SelectItem value="working">Anwesend</SelectItem>
              <SelectItem value="break">In Pause</SelectItem>
              <SelectItem value="absent">Abwesend</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teamMembers
            .filter((m) => teamFilter === "all" || m.current_status === teamFilter)
            .map((member) => {
              const location = WORK_LOCATIONS.find((l) => l.value === member.current_location)
              const LocationIcon = location?.icon || Building2

              return (
                <div
                  key={member.id}
                  className={cn(
                    "p-4 rounded-lg border-2 transition-colors",
                    member.current_status === "working"
                      ? "border-green-200 bg-green-50"
                      : member.current_status === "break"
                        ? "border-yellow-200 bg-yellow-50"
                        : "border-gray-200 bg-gray-50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>
                        {member.first_name?.[0]}
                        {member.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">
                        {member.first_name} {member.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        {member.current_status === "working" ? (
                          <>
                            <LocationIcon className="h-3 w-3" />
                            {location?.label || "Arbeitet"}
                          </>
                        ) : member.current_status === "break" ? (
                          <>
                            <Coffee className="h-3 w-3" />
                            In Pause
                          </>
                        ) : (
                          "Nicht anwesend"
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={cn(
                          "text-lg font-bold",
                          member.current_status === "working"
                            ? "text-green-600"
                            : member.current_status === "break"
                              ? "text-yellow-600"
                              : "text-gray-400",
                        )}
                      >
                        {formatMinutes(member.today_minutes || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">heute</div>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>

        {teamMembers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Keine Teammitglieder gefunden</div>
        )}
      </CardContent>
    </Card>
  )
}
