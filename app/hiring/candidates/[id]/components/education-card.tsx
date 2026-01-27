"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GraduationCap } from "lucide-react"
import type { Candidate } from "../types"

interface EducationCardProps {
  candidate: Candidate
}

export function EducationCard({ candidate }: EducationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Ausbildung & Qualifikationen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {candidate.education && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Ausbildung</p>
            <p className="whitespace-pre-wrap">{candidate.education}</p>
          </div>
        )}
        {candidate.skills && Array.isArray(candidate.skills) && candidate.skills.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Fähigkeiten</p>
            <div className="flex flex-wrap gap-2">
              {candidate.skills.map((skill: string, idx: number) => (
                <Badge key={idx} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {candidate.languages && Array.isArray(candidate.languages) && candidate.languages.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Sprachen</p>
            <div className="flex flex-wrap gap-2">
              {candidate.languages.map((lang: string, idx: number) => (
                <Badge key={idx} variant="outline">
                  {lang}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {candidate.certifications &&
          Array.isArray(candidate.certifications) &&
          candidate.certifications.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Zertifikate</p>
              <ul className="list-disc list-inside space-y-1">
                {candidate.certifications.map((cert: string, idx: number) => (
                  <li key={idx}>{cert}</li>
                ))}
              </ul>
            </div>
          )}
      </CardContent>
    </Card>
  )
}
