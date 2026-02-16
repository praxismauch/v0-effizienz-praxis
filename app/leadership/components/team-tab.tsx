"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import type { TeamPerformance } from "../types"
import { getScoreColor } from "../types"
import { getRoleLabel } from "@/lib/roles"

interface TeamTabProps {
  teamMembers?: TeamPerformance[]
  teamPerformance?: TeamPerformance[]
  isLoading?: boolean
}

export default function TeamTab({ teamMembers, teamPerformance, isLoading }: TeamTabProps) {
  const members = teamMembers || teamPerformance || []

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Laden...</div>
  }

  if (members.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">Keine Teammitglieder gefunden.</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => (
        <Card key={member.memberId}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={member.avatar || "/placeholder.svg"} />
                <AvatarFallback>
                  {member.memberName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{member.memberName}</h3>
                <p className="text-sm text-muted-foreground">{getRoleLabel(member.role)}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Aufgaben</span>
                <span>
                  {member.completedTasks}/{member.totalTasks}
                </span>
              </div>
              <Progress value={(member.completedTasks / member.totalTasks) * 100} />
              <div className="flex justify-between text-sm">
                <span>Zufriedenheit</span>
                <span className={getScoreColor(member.satisfaction)}>{member.satisfaction}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
