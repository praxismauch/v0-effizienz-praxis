"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface FeedbackTabProps {
  strengths: string
  areasForImprovement: string
  achievements: string
  challenges: string
  employeeSelfAssessment: string
  managerComments: string
  onUpdate: (field: string, value: string) => void
}

export function FeedbackTab({
  strengths,
  areasForImprovement,
  achievements,
  challenges,
  employeeSelfAssessment,
  managerComments,
  onUpdate,
}: FeedbackTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Stärken</Label>
          <Textarea
            value={strengths}
            onChange={(e) => onUpdate("strengths", e.target.value)}
            placeholder="Was macht der Mitarbeiter besonders gut?"
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <Label>Entwicklungsfelder</Label>
          <Textarea
            value={areasForImprovement}
            onChange={(e) => onUpdate("areas_for_improvement", e.target.value)}
            placeholder="Wo gibt es Verbesserungspotential?"
            rows={4}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Erfolge & Achievements</Label>
          <Textarea
            value={achievements}
            onChange={(e) => onUpdate("achievements", e.target.value)}
            placeholder="Wichtige Erfolge der letzten Periode"
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <Label>Herausforderungen</Label>
          <Textarea
            value={challenges}
            onChange={(e) => onUpdate("challenges", e.target.value)}
            placeholder="Welche Herausforderungen gab es?"
            rows={4}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Selbsteinschätzung Mitarbeiter</Label>
        <Textarea
          value={employeeSelfAssessment}
          onChange={(e) => onUpdate("employee_self_assessment", e.target.value)}
          placeholder="Wie schätzt der Mitarbeiter seine eigene Leistung ein?"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>Kommentare Vorgesetzter</Label>
        <Textarea
          value={managerComments}
          onChange={(e) => onUpdate("manager_comments", e.target.value)}
          placeholder="Zusätzliche Kommentare und Beobachtungen"
          rows={4}
        />
      </div>
    </div>
  )
}
