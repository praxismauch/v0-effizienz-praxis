"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase } from "lucide-react"
import type { Candidate } from "../types"

interface ExperienceCardProps {
  candidate: Candidate
}

export function ExperienceCard({ candidate }: ExperienceCardProps) {
  const hasExperience = candidate.current_position || candidate.current_company || candidate.years_of_experience

  if (!hasExperience) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Berufserfahrung & Beschäftigung
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {candidate.current_position && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Aktuelle Position</p>
              <p className="font-medium">{candidate.current_position}</p>
            </div>
          )}
          {candidate.current_company && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Aktuelles Unternehmen</p>
              <p className="font-medium">{candidate.current_company}</p>
            </div>
          )}
          {candidate.years_of_experience !== undefined && candidate.years_of_experience !== null && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Berufserfahrung</p>
              <p className="font-medium">{candidate.years_of_experience} Jahre</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
